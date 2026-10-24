import { SetMetadata } from '@nestjs/common';

export const REDIS_STREAM_HANDLE = Symbol('REDIS_STREAM_HANDLE');

export const RedisStreamHandle = (eventName: string): MethodDecorator =>
  SetMetadata(REDIS_STREAM_HANDLE, eventName);
