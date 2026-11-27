import 'reflect-metadata';
import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { INBOX_SERVICE, OUTBOX_SERVICE, TOPOLOGY_REGISTRY } from '../messaging';
import { LOCAL_STORAGE_SERVICE, STORAGE_CONTRACT } from '../storage';
import { VIDEO_TRANSCODE_CONTRACT } from '../../infra/video-transcode';
import { VideoProcessService } from './application/services/video-process.service';
import { VideoUploadConsumer } from './infra/consumers/video-upload.consumer';
import { VIDEO_PROCESS_TOPOLOGY } from './infra/messaging/video-process.topology';
import { VideoProcessModule } from './videoprocess.module';

const registry = { register: vi.fn() };
@Global()
@Module({
  providers: [
    { provide: TOPOLOGY_REGISTRY, useValue: registry },
    { provide: INBOX_SERVICE, useValue: {} },
    { provide: OUTBOX_SERVICE, useValue: {} },
  ],
  exports: [TOPOLOGY_REGISTRY, INBOX_SERVICE, OUTBOX_SERVICE],
})
class MessagingStubModule {}

describe('VideoProcessModule', () => {
  it('registers topology and resolves providers using public dependency contracts', async () => {
    registry.register.mockClear();
    const module = await Test.createTestingModule({
      imports: [MessagingStubModule, VideoProcessModule],
    })
      .overrideProvider(INBOX_SERVICE)
      .useValue({ executeOnce: vi.fn() })
      .overrideProvider(OUTBOX_SERVICE)
      .useValue({ publish: vi.fn() })
      .overrideProvider(LOCAL_STORAGE_SERVICE)
      .useValue({})
      .overrideProvider(STORAGE_CONTRACT)
      .useValue({})
      .overrideProvider(VIDEO_TRANSCODE_CONTRACT)
      .useValue({})
      .compile();
    expect(module.get(VideoProcessService)).toBeInstanceOf(VideoProcessService);
    expect(module.get(VideoUploadConsumer)).toBeInstanceOf(VideoUploadConsumer);
    expect(registry.register).toHaveBeenCalledExactlyOnceWith(
      VIDEO_PROCESS_TOPOLOGY,
    );
    await module.close();
  });
});
