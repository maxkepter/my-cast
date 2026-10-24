import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule as NestMailerVendorModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    NestMailerVendorModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const user = config.get<string>('MAIL_USER');
        const pass = config.get<string>('MAIL_PASSWORD');

        return {
          transport: {
            host: config.get<string>('MAIL_HOST', 'localhost'),
            port: Number(config.get<number>('MAIL_PORT', 587)),
            secure: config.get<string>('MAIL_SECURE') === 'true',
            auth: user && pass ? { user, pass } : undefined,
          },
          defaults: {
            from: config.get<string>(
              'MAIL_FROM',
              '"No Reply" <noreply@example.com>',
            ),
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
  exports: [NestMailerVendorModule],
})
export class MailerModule {}
