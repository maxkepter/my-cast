import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExchangeType,
  InboxCreateReq,
  InboxServiceContract,
  TransportType,
} from '../../../messaging';
import { UserRegisteredEvent } from '../../../../features/auth/domain/events/user-registered.event';
import { UserCreatedEvent } from '../../../../features/user/domain/events/user-created.event';
import { SendVerificationEmailHandler } from '../../application/handlers/send-verification-email.handler';
import { SendWelcomeEmailHandler } from '../../application/handlers/send-welcome-email.handler';
import { MAIL_MESSAGING_TOPOLOGY } from '../messaging/mail-messaging.topology';
import { MailListener } from './mail.listener';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('MailListener', () => {
  let executeOnceMock: ReturnType<typeof vi.fn>;
  let inboxServiceMock: InboxServiceContract;
  let verificationHandleMock: ReturnType<typeof vi.fn>;
  let welcomeHandleMock: ReturnType<typeof vi.fn>;
  let sendVerificationEmailHandler: SendVerificationEmailHandler;
  let sendWelcomeEmailHandler: SendWelcomeEmailHandler;
  let mailListener: MailListener;

  beforeEach(() => {
    executeOnceMock = vi.fn(
      async (
        _req: InboxCreateReq,
        data: unknown,
        handler: { handle: (payload: unknown) => Promise<void> },
      ) => {
        await handler.handle(data);
        return true;
      },
    );

    inboxServiceMock = {
      tryInsert: vi.fn(),
      findByEventAndConsumer: vi.fn(),
      markAsProcessed: vi.fn(),
      markAsFailed: vi.fn(),
      deleteProcessedBefore: vi.fn(),
      executeOnce: executeOnceMock as InboxServiceContract['executeOnce'],
    };

    verificationHandleMock = vi.fn().mockResolvedValue(undefined);
    welcomeHandleMock = vi.fn().mockResolvedValue(undefined);

    sendVerificationEmailHandler = {
      handle: verificationHandleMock,
    } as unknown as SendVerificationEmailHandler;

    sendWelcomeEmailHandler = {
      handle: welcomeHandleMock,
    } as unknown as SendWelcomeEmailHandler;

    mailListener = new MailListener(
      sendVerificationEmailHandler,
      sendWelcomeEmailHandler,
      inboxServiceMock,
    );
  });

  describe('MAIL_MESSAGING_TOPOLOGY', () => {
    it('declares user.events topic exchange and durable mail consumer queues', () => {
      expect(MAIL_MESSAGING_TOPOLOGY.exchanges).toEqual([
        {
          name: 'user.events',
          type: ExchangeType.TOPIC,
          options: { durable: true },
        },
      ]);
      expect(MAIL_MESSAGING_TOPOLOGY.queues).toEqual([
        {
          queueName: 'mail.user-registered.queue',
          options: { durable: true },
          queueBindings: [
            {
              exchange: 'user.events',
              routingKey: UserRegisteredEvent.EVENT_NAME,
            },
          ],
        },
        {
          queueName: 'mail.user-created.queue',
          options: { durable: true },
          queueBindings: [
            {
              exchange: 'user.events',
              routingKey: UserCreatedEvent.EVENT_NAME,
            },
          ],
        },
      ]);
    });
  });

  describe('handleUserRegistered', () => {
    it('delegates plain object payload to INBOX_SERVICE.executeOnce and invokes handler', async () => {
      const event = new UserRegisteredEvent(
        'verify@example.com',
        'Verify User',
        '123456',
        300,
      );
      const plainPayload = JSON.parse(event.serialize()) as UserRegisteredEvent;

      await mailListener.handleUserRegistered(plainPayload);

      expect(executeOnceMock).toHaveBeenCalledTimes(1);
      expect(executeOnceMock).toHaveBeenCalledWith(
        {
          eventId: event.id,
          consumer: 'MailListener.handleUserRegistered',
          eventType: UserRegisteredEvent.EVENT_NAME,
          payload: JSON.stringify(plainPayload),
          transport: TransportType.RABBITMQ,
          source: 'user.events',
        },
        plainPayload,
        sendVerificationEmailHandler,
      );
      expect(verificationHandleMock).toHaveBeenCalledTimes(1);
      expect(verificationHandleMock).toHaveBeenCalledWith(plainPayload);
    });

    it('deserializes JSON string payload, preserves eventId, and delegates to INBOX_SERVICE.executeOnce', async () => {
      const event = new UserRegisteredEvent(
        'string-verify@example.com',
        'String User',
        '654321',
        180,
      );
      const serialized = event.serialize();

      await mailListener.handleUserRegistered(serialized);

      expect(executeOnceMock).toHaveBeenCalledTimes(1);
      const [req, passedPayload, passedHandler] =
        executeOnceMock.mock.calls[0];
      expect(req).toEqual({
        eventId: event.id,
        consumer: 'MailListener.handleUserRegistered',
        eventType: UserRegisteredEvent.EVENT_NAME,
        payload: serialized,
        transport: TransportType.RABBITMQ,
        source: 'user.events',
      });
      expect(passedPayload).toBeInstanceOf(UserRegisteredEvent);
      expect(passedPayload).toMatchObject({
        id: event.id,
        email: 'string-verify@example.com',
        displayName: 'String User',
        code: '654321',
        expiresInSeconds: 180,
      });
      expect(passedHandler).toBe(sendVerificationEmailHandler);
      expect(verificationHandleMock).toHaveBeenCalledWith(passedPayload);
    });

    it('derives deterministic UUID fallback when event id is missing', async () => {
      const rawWithoutId = JSON.stringify({
        email: 'noid@example.com',
        displayName: 'No Id',
        code: '111222',
        expiresInSeconds: 120,
      });

      await mailListener.handleUserRegistered(rawWithoutId);
      await mailListener.handleUserRegistered(rawWithoutId);

      const firstReq = executeOnceMock.mock.calls[0][0] as InboxCreateReq;
      const secondReq = executeOnceMock.mock.calls[1][0] as InboxCreateReq;
      expect(firstReq.eventId).toMatch(UUID_REGEX);
      expect(firstReq.eventId).toBe(secondReq.eventId);
    });

    it('does not invoke handler when INBOX_SERVICE.executeOnce detects duplicate', async () => {
      executeOnceMock.mockResolvedValueOnce(false);
      const event = new UserRegisteredEvent(
        'dup@example.com',
        'Dup User',
        '000000',
        60,
      );

      await mailListener.handleUserRegistered(event);

      expect(executeOnceMock).toHaveBeenCalledTimes(1);
      expect(verificationHandleMock).not.toHaveBeenCalled();
    });
  });

  describe('handleUserCreated', () => {
    it('delegates plain object payload to INBOX_SERVICE.executeOnce and invokes handler', async () => {
      const event = new UserCreatedEvent(
        'user-123',
        'welcome@example.com',
        'Welcome User',
        'welcomeuser',
      );
      const plainPayload = JSON.parse(event.serialize()) as UserCreatedEvent;

      await mailListener.handleUserCreated(plainPayload);

      expect(executeOnceMock).toHaveBeenCalledTimes(1);
      expect(executeOnceMock).toHaveBeenCalledWith(
        {
          eventId: event.id,
          consumer: 'MailListener.handleUserCreated',
          eventType: UserCreatedEvent.EVENT_NAME,
          payload: JSON.stringify(plainPayload),
          transport: TransportType.RABBITMQ,
          source: 'user.events',
        },
        plainPayload,
        sendWelcomeEmailHandler,
      );
      expect(welcomeHandleMock).toHaveBeenCalledTimes(1);
      expect(welcomeHandleMock).toHaveBeenCalledWith(plainPayload);
    });

    it('deserializes JSON string payload, preserves eventId, and delegates to INBOX_SERVICE.executeOnce', async () => {
      const event = new UserCreatedEvent(
        'user-456',
        'string-welcome@example.com',
        'String Welcome',
        'stringwelcome',
      );
      const serialized = event.serialize();

      await mailListener.handleUserCreated(serialized);

      expect(executeOnceMock).toHaveBeenCalledTimes(1);
      const [req, passedPayload, passedHandler] =
        executeOnceMock.mock.calls[0];
      expect(req).toEqual({
        eventId: event.id,
        consumer: 'MailListener.handleUserCreated',
        eventType: UserCreatedEvent.EVENT_NAME,
        payload: serialized,
        transport: TransportType.RABBITMQ,
        source: 'user.events',
      });
      expect(passedPayload).toBeInstanceOf(UserCreatedEvent);
      expect(passedPayload).toMatchObject({
        id: event.id,
        userId: 'user-456',
        email: 'string-welcome@example.com',
        displayName: 'String Welcome',
        userName: 'stringwelcome',
      });
      expect(passedHandler).toBe(sendWelcomeEmailHandler);
      expect(welcomeHandleMock).toHaveBeenCalledWith(passedPayload);
    });

    it('derives deterministic UUID fallback when event id is missing', async () => {
      const rawWithoutId = JSON.stringify({
        userId: 'user-789',
        email: 'noid-created@example.com',
        displayName: 'No Id Created',
        userName: 'noidcreated',
      });

      await mailListener.handleUserCreated(rawWithoutId);
      await mailListener.handleUserCreated(rawWithoutId);

      const firstReq = executeOnceMock.mock.calls[0][0] as InboxCreateReq;
      const secondReq = executeOnceMock.mock.calls[1][0] as InboxCreateReq;
      expect(firstReq.eventId).toMatch(UUID_REGEX);
      expect(firstReq.eventId).toBe(secondReq.eventId);
    });

    it('does not invoke handler when INBOX_SERVICE.executeOnce detects duplicate', async () => {
      executeOnceMock.mockResolvedValueOnce(false);
      const event = new UserCreatedEvent(
        'user-999',
        'dup-created@example.com',
        'Dup Created',
        'dupcreated',
      );

      await mailListener.handleUserCreated(event);

      expect(executeOnceMock).toHaveBeenCalledTimes(1);
      expect(welcomeHandleMock).not.toHaveBeenCalled();
    });
  });
});
