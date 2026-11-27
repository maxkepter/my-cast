import { ModuleTopology, TransportType } from '../../../../core/messaging';
import { CommentCreatedEvent } from '../../domain/events/comment-created.event';
import { CommentDeletedEvent } from '../../domain/events/comment-deleted.event';
import { ContentReportedEvent } from '../../domain/events/content-reported.event';
import { UserBlockedEvent } from '../../domain/events/user-blocked.event';

export const INTERACTION_MESSAGING_TOPOLOGY: ModuleTopology = {
  routes: [
    {
      eventType: CommentCreatedEvent.EVENT_NAME,
      transport: TransportType.REDIS_STREAM,
      destination: CommentCreatedEvent.EVENT_NAME,
    },
    {
      eventType: CommentDeletedEvent.EVENT_NAME,
      transport: TransportType.REDIS_STREAM,
      destination: CommentDeletedEvent.EVENT_NAME,
    },
    {
      eventType: ContentReportedEvent.EVENT_NAME,
      transport: TransportType.REDIS_STREAM,
      destination: ContentReportedEvent.EVENT_NAME,
    },
    {
      eventType: UserBlockedEvent.EVENT_NAME,
      transport: TransportType.REDIS_STREAM,
      destination: UserBlockedEvent.EVENT_NAME,
    },
  ],
};
