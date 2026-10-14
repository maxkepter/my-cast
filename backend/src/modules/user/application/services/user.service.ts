import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Page } from '../../../../common/dtos/page.dto';
import { UserRes } from '../../dtos/dto.res';
import {
  UserCreateReq,
  UserFilterReq,
  UserUpdateReq,
} from '../../dtos/req.dto';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { GetUserUsecase } from '../usecases/get-user.usecase';
import { UpdateUserUsecase } from '../usecases/update-user.usecase';
import { UserCreatUsecase } from '../usecases/user-create.usecase';

@Injectable()
export class UserService
  implements UserCreatUsecase, GetUserUsecase, UpdateUserUsecase
{
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async createUser(req: UserCreateReq): Promise<UserRes> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);

      const existing = await repo.findOne({
        where: [{ username: req.username }, { email: req.email }],
      });
      if (existing) {
        throw new ConflictException('Username or email already exists');
      }

      const profile = new UserProfile();
      profile.displayName = req.displayName;

      const user = repo.create({
        username: req.username,
        email: req.email,
        profile,
        role: Role.USER,
      });

      const saved = await repo.save(user);
      return UserRes.of(saved);
    });
  }

  async getUserById(userId: string): Promise<UserRes> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');
    return UserRes.of(user);
  }

  async getUser(req: UserFilterReq): Promise<Page<UserRes>> {
    const page = Math.max(1, req.page || 1);
    const size = Math.max(1, req.size || 10);

    const qb = this.userRepo.createQueryBuilder('user');

    if (req.role) {
      qb.andWhere('user.role = :role', { role: req.role });
    }

    if (req.search) {
      qb.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.displayName ILIKE :search)',
        { search: `%${req.search}%` },
      );
    }

    qb.skip((page - 1) * size).take(size);

    const [data, total] = await qb.getManyAndCount();
    return Page.of(
      data.map((u) => UserRes.of(u)),
      total,
      { page, size },
    );
  }

  async updateUser(userId: string, req: UserUpdateReq): Promise<UserRes> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);

      const user = await repo.findOne({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');

      if (req.email && req.email !== user.email) {
        const existing = await repo.findOne({ where: { email: req.email } });
        if (existing) throw new ConflictException('Email already in use');
        user.updateEmail(req.email);
      }

      if (req.displayName) {
        user.profile.updateDisplayName(req.displayName);
      }

      if (req.avatar !== undefined) {
        user.profile.updateAvatar(req.avatar);
      }

      const saved = await repo.save(user);
      return UserRes.of(saved);
    });
  }

  async updateRole(userId: string, newRole: Role): Promise<UserRes> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const user = await repo.findOne({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');

      user.updateRole(newRole);
      const saved = await repo.save(user);
      return UserRes.of(saved);
    });
  }

  async deactivateUser(userId: string): Promise<UserRes> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const user = await repo.findOne({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');

      user.deactivate();
      const saved = await repo.save(user);
      return UserRes.of(saved);
    });
  }
}
