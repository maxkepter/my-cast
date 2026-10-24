import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CLIENT_SERVICE } from './application/client-service.interface';
import { AxiosClientService } from './axios/axios-client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AxiosClientService,
    {
      provide: CLIENT_SERVICE,
      useExisting: AxiosClientService,
    },
  ],
  exports: [CLIENT_SERVICE, AxiosClientService],
})
export class ClientModule {}
