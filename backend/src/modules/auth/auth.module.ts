import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RefreshToken } from './domain/entities/refresh-token.entity';
import { User } from '../user/domain/entities/user.entity';
import { AuthService } from './application/services/auth.service';
import { RefreshTokenService } from './application/services/refresh-token.service';
import { AuthController } from './infra/controllers/auth.controller';
import { JwtStrategy } from './infra/strategies/jwt.strategy';
import { JwtGuard } from './infra/guards/jwt.guard';
import { RoleGuard } from './infra/guards/role.guard';
import { UserModule } from '../user/user.module';
import { RedisModule } from '../infra/cache/redis/redis.module';
import { EventModule } from '../infra/event/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'jwt-secret'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRATION', '1h') as any),
        },
      }),
    }),
    ConfigModule,
    UserModule,
    RedisModule,
    EventModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtStrategy,
    JwtGuard,
    RoleGuard,
  ],
  exports: [
    AuthService,
    RefreshTokenService,
    JwtGuard,
    RoleGuard,
    JwtModule,
    PassportModule,
    TypeOrmModule,
  ],
})
export class AuthModule {}
