import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import { BaseService } from '../../../../../common/application/service/base.service';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from '../../../user/domain/enums/role.enum';
import { UserProfile } from '../../../user/domain/value-objects/user-profile.vo';
import { UserRes } from '../../../user/dtos/dto.res';
import { GoogleLoginReq } from '../../dtos/req.dto';
import { AuthRes, JwtRes } from '../../dtos/res.dto';
import { RefreshTokenUseCase } from '../usecases/refresh-token.usecase';
import { GoogleLoginUseCase } from '../usecases/google-login.usecase';
import { RefreshTokenService } from './refresh-token.service';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';
import { UserCreatedEvent } from '../../../user/domain/events/user-created.event';

@Injectable()
export class AuthService
  extends BaseService
  implements RefreshTokenUseCase, GoogleLoginUseCase
{
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly internalEventBus: InternalEventBus,
  ) {
    super(AuthService.name);
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async googleLogin(req: GoogleLoginReq): Promise<AuthRes> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    let payload;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: req.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        'Token Google không hợp lệ hoặc đã hết hạn',
      );
    }

    if (!payload || !payload.email) {
      throw new BadRequestException(
        'Không tìm thấy thông tin email từ Google account',
      );
    }

    const { email, sub: googleId, name, picture } = payload;

    let user = await this.userRepo.findOne({
      where: [{ googleId }, { email }],
    });

    if (user) {
      let isUpdated = false;

      if (!user.googleId) {
        user.updateGoogleId(googleId);
        isUpdated = true;
      }

      if (picture && !user.profile?.avatar) {
        if (!user.profile) {
          user.profile = UserProfile.create(name || user.username, picture);
        } else {
          user.profile.updateAvatar(picture);
        }
        isUpdated = true;
      }

      if (isUpdated) {
        user = await this.userRepo.save(user);
      }
    } else {
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

      let username = baseUsername || `user_${Date.now()}`;

      const existingUsername = await this.userRepo.findOne({
        where: { username },
      });

      if (existingUsername) {
        username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const profile = UserProfile.create(name || username, picture);
      user = User.create(username, email, Role.USER, profile, googleId);
      user = this.userRepo.create(user);
      user = await this.userRepo.save(user);

      await this.internalEventBus.publish(
        new UserCreatedEvent(
          user.userId,
          user.email,
          user.profile?.displayName || user.username,
          user.username,
        ),
      );
    }

    if (!user.isActived()) {
      throw new UnauthorizedException('User account is inactive');
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
