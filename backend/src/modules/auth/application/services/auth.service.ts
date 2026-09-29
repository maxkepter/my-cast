import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { BaseService } from '../../../../common/application/service/base.service';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from '../../../user/domain/enums/role.enum';
import { UserProfile } from '../../../user/domain/value-objects/user-profile.vo';
import { UserRes } from '../../../user/dtos/dto.res';
import {
  ForgotPasswordReq,
  LoginReq,
  RegisterReq,
  UpdatePasswordReq,
  VerifyEmailReq,
} from '../../dtos/req.dto';
import { AuthRes, JwtRes, RegisterPendingRes } from '../../dtos/res.dto';
import { LoginUseCase } from '../usecases/login.usecase';
import { RefreshTokenUseCase } from '../usecases/refresh-token.usecase';
import { UpdatePasswordUseCase } from '../usecases/update-password.usecase';
import { RegisterUseCase } from '../usecases/register.usecase';
import { ForgotPasswordUseCase } from '../usecases/forgot-password.usecase';
import { RefreshTokenService } from './refresh-token.service';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../infra/event/application/internal-event-bus.interface';
import {
  CACHE_SERVICE,
  CacheService,
} from '../../../infra/cache/application/interface/cache-service.interface';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserCreatedEvent } from '../../../user/domain/events/user-created.event';

@Injectable()
export class AuthService
  extends BaseService
  implements
    LoginUseCase,
    RefreshTokenUseCase,
    UpdatePasswordUseCase,
    RegisterUseCase,
    ForgotPasswordUseCase
{
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly internalEventBus: InternalEventBus,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: CacheService,
  ) {
    super(AuthService.name);
  }

  async login(req: LoginReq): Promise<AuthRes> {
    const user = await this.userRepo.findOne({
      where: { username: req.username },
    });

    if (!user || !user.password || !user.isActived()) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(req.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.generateAuthRes(user);
  }

  async refreshToken(token: string): Promise<AuthRes> {
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const storedToken =
      await this.refreshTokenService.validateRefreshToken(token);

    const user = await this.userRepo.findOne({
      where: { userId: storedToken.userId },
    });

    if (!user || !user.isActived()) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    // Token rotation: revoke used token
    await this.refreshTokenService.revokeRefreshToken(token);

    return this.generateAuthRes(user);
  }

  async updatePassword(userId: string, req: UpdatePasswordReq): Promise<void> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.password) {
      const isOldPasswordValid = await bcrypt.compare(
        req.oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new BadRequestException('Old password is incorrect');
      }
    }

    const hashedPassword = await bcrypt.hash(req.newPassword, 10);
    user.updatePassword(hashedPassword);
    await this.userRepo.save(user);

    // Revoke all existing refresh tokens for this user
    await this.refreshTokenService.revokeRefreshTokenByUserId(userId);
  }

  async register(req: RegisterReq): Promise<RegisterPendingRes> {
    const existing = await this.userRepo.findOne({
      where: [{ username: req.username }, { email: req.email }],
    });
    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(req.password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = Number(
      this.configService.get<number>('EMAIL_VERIFICATION_TTL', 900),
    );

    const cacheKey = `auth:verify:${req.email}`;
    await this.cacheService.set(
      cacheKey,
      {
        email: req.email,
        username: req.username,
        password: hashedPassword,
        displayName: req.displayName,
        code,
      },
      ttl,
    );

    await this.internalEventBus.publish(
      new UserRegisteredEvent(req.email, req.displayName, code, ttl),
    );

    return {
      message: 'Verification code sent to email',
      email: req.email,
    };
  }

  async verifyEmail(req: VerifyEmailReq): Promise<UserRes> {
    const cacheKey = `auth:verify:${req.email}`;
    const cachedData = await this.cacheService.get<{
      email: string;
      username: string;
      password: string;
      displayName: string;
      code: string;
    }>(cacheKey);

    if (!cachedData) {
      throw new BadRequestException(
        'Verification code has expired or is invalid',
      );
    }

    if (cachedData.code !== req.code) {
      throw new BadRequestException('Invalid verification code');
    }

    const existing = await this.userRepo.findOne({
      where: [{ username: cachedData.username }, { email: cachedData.email }],
    });
    if (existing) {
      await this.cacheService.del(cacheKey);
      throw new ConflictException('Username or email already exists');
    }

    const profile = new UserProfile();
    profile.displayName = cachedData.displayName;

    const user = this.userRepo.create({
      username: cachedData.username,
      email: cachedData.email,
      password: cachedData.password,
      profile,
      role: Role.USER,
      isActive: true,
    });
    const savedUser = await this.userRepo.save(user);

    await this.cacheService.del(cacheKey);

    await this.internalEventBus.publish(
      new UserCreatedEvent(
        savedUser.userId,
        savedUser.email,
        savedUser.profile?.displayName || savedUser.username,
        savedUser.username,
      ),
    );

    return UserRes.of(savedUser);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<void> {
    // ponytail: implement email sending via MAIL_SERVICE when forgot password flow is designed
    this.logger.log(`Forgot password requested for email: ${req.email}`);
  }

  private async generateAuthRes(user: User): Promise<AuthRes> {
    const payload: JwtRes = {
      sub: user.userId,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshTokenDays = Number(
      this.configService.get<number>('REFRESH_TOKEN_DAYS', 7),
    );

    const refreshToken = await this.refreshTokenService.createRefreshToken(
      user.userId,
      refreshTokenDays,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: UserRes.of(user),
    };
  }
}
