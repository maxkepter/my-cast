import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailerService } from '@nestjs-modules/mailer';
import { NestMailerService } from './infrastructure/adapters/nest-mailer.service';

describe('NestMailerService', () => {
  let service: NestMailerService;
  let mailerService: MailerService;

  beforeEach(() => {
    mailerService = {
      sendMail: vi.fn().mockResolvedValue({ messageId: '123' }),
    } as unknown as MailerService;

    service = new NestMailerService(mailerService);
  });

  it('should send email successfully', async () => {
    const options = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'welcome',
      context: { name: 'User', message: 'Hello' },
    };

    await expect(service.sendMail(options)).resolves.toBeUndefined();
    expect(mailerService.sendMail).toHaveBeenCalledWith(options);
  });

  it('should rethrow error when sendMail fails', async () => {
    const error = new Error('SMTP connection failed');
    vi.mocked(mailerService.sendMail).mockRejectedValueOnce(error);

    await expect(
      service.sendMail({
        to: 'fail@example.com',
        subject: 'Fail',
      }),
    ).rejects.toThrow('SMTP connection failed');
  });
});
