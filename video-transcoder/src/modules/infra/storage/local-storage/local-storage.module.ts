import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LOCAL_STORAGE_SERVICE } from './contracts/local-storage.contract';
import { FsLocalStorageService } from './services/fs-local-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    FsLocalStorageService,
    {
      provide: LOCAL_STORAGE_SERVICE,
      useExisting: FsLocalStorageService,
    },
  ],
  exports: [LOCAL_STORAGE_SERVICE, FsLocalStorageService],
})
export class LocalStorageModule {}
