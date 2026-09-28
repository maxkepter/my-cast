import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailer } from '@nestjs-modules/mailer';
import {
  MailService,
  SendMailOptions,
} from '../../application/interface/mail-service.interface';

@Injectable()
export class NestMailerService implements MailService {
  private readonly logger = new Logger(NestMailerService.name);

  constructor(private readonly mailerService: NestMailer) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail(options);
      this.logger.log(`Mail sent successfully to: ${options.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
