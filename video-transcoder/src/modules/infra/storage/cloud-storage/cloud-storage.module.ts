import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientModule } from '../../client/client.module';
import {
  CLOUD_STORAGE_SERVICE,
  STORAGE_CONTRACT,
} from './contracts/storage.contract';
import { HttpCloudStorageService } from './services/http-cloud-storage.service';

@Module({
  imports: [ConfigModule, ClientModule],
  controllers: [],
  providers: [
    HttpCloudStorageService,
    {
      provide: STORAGE_CONTRACT,
      useExisting: HttpCloudStorageService,
    },
    {
      provide: CLOUD_STORAGE_SERVICE,
      useExisting: HttpCloudStorageService,
    },
  ],
  exports: [STORAGE_CONTRACT, CLOUD_STORAGE_SERVICE, HttpCloudStorageService],
})
export class CloudStorageModule {}
