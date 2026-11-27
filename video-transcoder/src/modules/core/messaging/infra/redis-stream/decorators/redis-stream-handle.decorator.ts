import { SetMetadata } from '@nestjs/common';
import { REDIS_STREAM_HANDLE_METADATA } from '../constants';

export const RedisStreamHandle = (eventName: string): MethodDecorator =>
  SetMetadata(REDIS_STREAM_HANDLE_METADATA, eventName);
