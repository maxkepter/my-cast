import { Module } from '@nestjs/common';
import { LocalStorageModule } from './local-storage/local-storage.module';
import { CloudStorageModule } from './cloud-storage/cloud-storage.module';

@Module({
  imports: [LocalStorageModule, CloudStorageModule],
  controllers: [],
  providers: [],
  exports: [LocalStorageModule, CloudStorageModule],
})
export class StorageModule {}
