import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { QueueModule } from './queue/queue.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { VideoTranscodeModule } from './video-transcode/video-transcode.module';

@Module({
  imports: [ClientModule, QueueModule, RabbitmqModule, RedisModule, VideoTranscodeModule],
  exports: [ClientModule, QueueModule, RabbitmqModule, RedisModule, VideoTranscodeModule],
})
export class InfrastructureModule {}
