import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailerService as NestMailerVendorService } from '@nestjs-modules/mailer';
import { MailService } from './application/interface/mail-service.interface';
import { SendVerificationEmailHandler } from './application/handlers/send-verification-email.handler';
import { SendWelcomeEmailHandler } from './application/handlers/send-welcome-email.handler';
import { MailListener } from './infrastructure/listeners/mail.listener';
import { NestMailService } from './infrastructure/adapters/nest-mail.service';
import { UserRegisteredEvent } from '../../features/auth/domain/events/user-registered.event';
import { UserCreatedEvent } from '../../features/user/domain/events/user-created.event';

describe('MailModule Core Handlers & Listener', () => {
  let sendMailMock: ReturnType<typeof vi.fn>;
  let mockMailService: MailService;
  let sendVerificationEmailHandler: SendVerificationEmailHandler;
  let sendWelcomeEmailHandler: SendWelcomeEmailHandler;
  let mailListener: MailListener;

  beforeEach(() => {
    sendMailMock = vi.fn().mockResolvedValue(undefined);
    mockMailService = {
      sendMail: sendMailMock,
    };

    sendVerificationEmailHandler = new SendVerificationEmailHandler(
      mockMailService,
    );
    sendWelcomeEmailHandler = new SendWelcomeEmailHandler(mockMailService);
    mailListener = new MailListener(
      sendVerificationEmailHandler,
      sendWelcomeEmailHandler,
    );
  });

  describe('SendVerificationEmailHandler', () => {
    it('should send verification email with correct options', async () => {
      const event = new UserRegisteredEvent(
        'user@example.com',
        'Test User',
        '123456',
        300,
      );

      await expect(
        sendVerificationEmailHandler.handle(event),
      ).resolves.toBeUndefined();

      expect(sendMailMock).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Xác thực tài khoản - Mã OTP',
        template: 'verification',
        context: {
          name: 'Test User',
          code: '123456',
          expiresInMinutes: 5,
        },
      });
    });

    it('should use email as fallback when displayName is empty', async () => {
      const event = new UserRegisteredEvent(
        'user@example.com',
        '',
        '654321',
        60,
      );

      await expect(
        sendVerificationEmailHandler.handle(event),
      ).resolves.toBeUndefined();

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            name: 'user@example.com',
            code: '654321',
            expiresInMinutes: 1,
          },
        }),
      );
    });

    it('should rethrow error when mailService fails', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('SMTP connection error'));

      const event = new UserRegisteredEvent(
        'user@example.com',
        'Test User',
        '123456',
        300,
      );

      await expect(
        sendVerificationEmailHandler.handle(event),
      ).rejects.toThrow('SMTP connection error');
    });
  });

  describe('SendWelcomeEmailHandler', () => {
    it('should send welcome email with correct options', async () => {
      const event = new UserCreatedEvent(
        'user-id-1',
        'newuser@example.com',
        'New Member',
        'newmember',
      );

      await expect(
        sendWelcomeEmailHandler.handle(event),
      ).resolves.toBeUndefined();

      expect(sendMailMock).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: 'Chào mừng gia nhập hệ thống!',
        template: 'welcome',
        context: {
          name: 'New Member',
          message: 'Chào mừng bạn tham gia hệ thống!',
        },
      });
    });

    it('should rethrow error when mailService fails', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('SMTP timeout'));

      const event = new UserCreatedEvent(
        'user-id-2',
        'fail@example.com',
        'Fail User',
        'failuser',
      );

      await expect(
        sendWelcomeEmailHandler.handle(event),
      ).rejects.toThrow('SMTP timeout');
    });
  });

  describe('MailListener', () => {
    it('should handle UserRegisteredEvent instance directly', async () => {
      const event = new UserRegisteredEvent(
        'registered@example.com',
        'Registered User',
        '999999',
        180,
      );
      const handleSpy = vi.fn().mockResolvedValue(undefined);
      sendVerificationEmailHandler.handle = handleSpy;

      await mailListener.handleUserRegistered(event);

      expect(handleSpy).toHaveBeenCalledWith(event);
    });

    it('should handle UserRegisteredEvent serialized string', async () => {
      const event = new UserRegisteredEvent(
        'serialized@example.com',
        'Serialized User',
        '888888',
        120,
      );
      const serialized = event.serialize();
      const handleSpy = vi.fn().mockResolvedValue(undefined);
      sendVerificationEmailHandler.handle = handleSpy;

      await mailListener.handleUserRegistered(serialized);

      expect(handleSpy).toHaveBeenCalled();
    });

    it('should handle UserCreatedEvent instance directly', async () => {
      const event = new UserCreatedEvent(
        'uid-10',
        'listener@example.com',
        'Listener User',
        'listener',
      );
      const handleSpy = vi.fn().mockResolvedValue(undefined);
      sendWelcomeEmailHandler.handle = handleSpy;

      await mailListener.handleUserCreated(event);

      expect(handleSpy).toHaveBeenCalledWith(event);
    });

    it('should handle UserCreatedEvent serialized string', async () => {
      const event = new UserCreatedEvent(
        'uid-11',
        'serialized-created@example.com',
        'Created User',
        'createduser',
      );
      const serialized = event.serialize();
      const handleSpy = vi.fn().mockResolvedValue(undefined);
      sendWelcomeEmailHandler.handle = handleSpy;

      await mailListener.handleUserCreated(serialized);

      expect(handleSpy).toHaveBeenCalled();
    });
  });

  describe('NestMailService', () => {
    it('should delegate email sending to vendor mailer', async () => {
      const mockVendorMailer = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      } as unknown as NestMailerVendorService;
      const nestMailService = new NestMailService(mockVendorMailer);

      await nestMailService.sendMail({
        to: 'user@example.com',
        subject: 'Hello',
      });

      expect(mockVendorMailer.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Hello',
      });
    });
  });
});
