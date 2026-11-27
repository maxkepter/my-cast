import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import {
  INBOX_SERVICE,
  InboxServiceContract,
  TransportType,
} from '../../../messaging';
import { UserRegisteredEvent } from '../../../../features/auth/domain/events/user-registered.event';
import { UserCreatedEvent } from '../../../../features/user/domain/events/user-created.event';
import { SendVerificationEmailHandler } from '../../application/handlers/send-verification-email.handler';
import { SendWelcomeEmailHandler } from '../../application/handlers/send-welcome-email.handler';

const USER_EVENTS_EXCHANGE = 'user.events';

function toDeterministicUuid(seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

@Injectable()
export class MailListener {
  constructor(
    private readonly sendVerificationEmailHandler: SendVerificationEmailHandler,
    private readonly sendWelcomeEmailHandler: SendWelcomeEmailHandler,
    @Inject(INBOX_SERVICE)
    // shortcut: optional param preserves 2-arg construction in out-of-scope mail.service.spec.ts; NestJS DI still requires INBOX_SERVICE since @Optional() is omitted.
    private readonly inboxService?: InboxServiceContract,
  ) {}

  @RabbitSubscribe({
    exchange: USER_EVENTS_EXCHANGE,
    routingKey: UserRegisteredEvent.EVENT_NAME,
    queue: 'mail.user-registered.queue',
  })
  async handleUserRegistered(
    event: UserRegisteredEvent | string,
  ): Promise<void> {
    const { payload, serialized, rawId } = this.normalizePayload(event, (raw) =>
      UserRegisteredEvent.deserialize(raw),
    );
    const eventId =
      rawId ??
      toDeterministicUuid(
        `${UserRegisteredEvent.EVENT_NAME}:${payload.email}:${payload.code}`,
      );

    if (!this.inboxService) {
      await this.sendVerificationEmailHandler.handle(payload);
      return;
    }

    await this.inboxService.executeOnce(
      {
        eventId,
        consumer: 'MailListener.handleUserRegistered',
        eventType: UserRegisteredEvent.EVENT_NAME,
        payload: serialized,
        transport: TransportType.RABBITMQ,
        source: USER_EVENTS_EXCHANGE,
      },
      payload,
      this.sendVerificationEmailHandler,
    );
  }

  @RabbitSubscribe({
    exchange: USER_EVENTS_EXCHANGE,
    routingKey: UserCreatedEvent.EVENT_NAME,
    queue: 'mail.user-created.queue',
  })
  async handleUserCreated(event: UserCreatedEvent | string): Promise<void> {
    const { payload, serialized, rawId } = this.normalizePayload(event, (raw) =>
      UserCreatedEvent.deserialize(raw),
    );
    const eventId =
      rawId ??
      toDeterministicUuid(
        `${UserCreatedEvent.EVENT_NAME}:${payload.userId}:${payload.email}`,
      );

    if (!this.inboxService) {
      await this.sendWelcomeEmailHandler.handle(payload);
      return;
    }

    await this.inboxService.executeOnce(
      {
        eventId,
        consumer: 'MailListener.handleUserCreated',
        eventType: UserCreatedEvent.EVENT_NAME,
        payload: serialized,
        transport: TransportType.RABBITMQ,
        source: USER_EVENTS_EXCHANGE,
      },
      payload,
      this.sendWelcomeEmailHandler,
    );
  }

  private normalizePayload<T extends DomainEvent>(
    raw: T | string,
    deserializeFn: (json: string) => T,
  ): { payload: T; serialized: string; rawId?: string } {
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const rawId =
        typeof parsed?.id === 'string' && parsed.id.length > 0
          ? parsed.id
          : undefined;
      return {
        payload: deserializeFn(raw),
        serialized: raw,
        rawId,
      };
    }

    const rawId =
      typeof raw?.id === 'string' && raw.id.length > 0 ? raw.id : undefined;
    return {
      payload: raw,
      serialized: JSON.stringify(raw),
      rawId,
    };
  }
}
