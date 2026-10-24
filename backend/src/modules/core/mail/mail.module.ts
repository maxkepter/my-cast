import { Module } from '@nestjs/common';
import { MailerModule } from '../../infra/mailer/mailer.module';
import { MAIL_SERVICE } from './application/interface/mail-service.interface';
import { SendVerificationEmailHandler } from './application/handlers/send-verification-email.handler';
import { SendWelcomeEmailHandler } from './application/handlers/send-welcome-email.handler';
import { MailListener } from './infrastructure/listeners/mail.listener';
import { NestMailService } from './infrastructure/adapters/nest-mail.service';

@Module({
  imports: [MailerModule],
  controllers: [],
  providers: [
    SendVerificationEmailHandler,
    SendWelcomeEmailHandler,
    MailListener,
    NestMailService,
    {
      provide: MAIL_SERVICE,
      useExisting: NestMailService,
    },
  ],
  exports: [MAIL_SERVICE, NestMailService],
})
export class MailModule {}
