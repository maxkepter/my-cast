import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerVendorService } from '@nestjs-modules/mailer';
import {
  MailService,
  SendMailOptions,
} from '../../application/interface/mail-service.interface';

@Injectable()
export class NestMailService implements MailService {
  private readonly logger = new Logger(NestMailService.name);

  constructor(private readonly vendorMailer: NestMailerVendorService) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    const recipient =
      typeof options.to === 'string'
        ? options.to
        : JSON.stringify(options.to ?? '');
    try {
      await this.vendorMailer.sendMail(options);
      this.logger.log(`Mail sent successfully to: ${recipient}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send email to ${recipient}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
