/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { VideoProcessModule } from './video-process/videoprocess.module';

@Module({
  imports: [VideoProcessModule],
  controllers: [],
  providers: [],
})
export class CoreModule {}
