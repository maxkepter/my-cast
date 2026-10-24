import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailerService as NestMailerVendorService } from '@nestjs-modules/mailer';
import { NestMailService } from './nest-mail.service';

describe('NestMailService', () => {
  let service: NestMailService;
  let mockVendorMailer: NestMailerVendorService;

  beforeEach(() => {
    mockVendorMailer = {
      sendMail: vi.fn().mockResolvedValue({ messageId: '123' }),
    } as unknown as NestMailerVendorService;

    service = new NestMailService(mockVendorMailer);
  });

  it('should send email successfully with string recipient', async () => {
    const options = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'welcome',
      context: { name: 'User', message: 'Hello' },
    };

    await expect(service.sendMail(options)).resolves.toBeUndefined();
    expect(mockVendorMailer.sendMail).toHaveBeenCalledWith(options);
  });

  it('should send email successfully with non-string recipient', async () => {
    const options = {
      to: ['user1@example.com', 'user2@example.com'],
      subject: 'Batch Subject',
      template: 'notice',
    };

    await expect(service.sendMail(options)).resolves.toBeUndefined();
    expect(mockVendorMailer.sendMail).toHaveBeenCalledWith(options);
  });

  it('should rethrow error when vendorMailer fails', async () => {
    const error = new Error('SMTP connection failed');
    vi.mocked(mockVendorMailer.sendMail).mockRejectedValueOnce(error);

    await expect(
      service.sendMail({
        to: 'fail@example.com',
        subject: 'Fail',
      }),
    ).rejects.toThrow('SMTP connection failed');
  });

  it('should handle non-Error throw gracefully', async () => {
    vi.mocked(mockVendorMailer.sendMail).mockRejectedValueOnce('Unknown string error');

    await expect(
      service.sendMail({
        to: 'fail@example.com',
        subject: 'Fail',
      }),
    ).rejects.toBe('Unknown string error');
  });
});
