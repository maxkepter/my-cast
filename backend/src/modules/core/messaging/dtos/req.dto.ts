import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TransportType } from '../contracts/topology-registry/topology-registry';

export class OutboxCreateReq {
  @IsUUID()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventType!: string;

  @IsString()
  @IsNotEmpty()
  payload!: string;

  @IsEnum(TransportType)
  transport!: TransportType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destination!: string;
}

export class InboxCreateReq {
  @IsUUID()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  consumer!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventType!: string;

  @IsString()
  @IsNotEmpty()
  payload!: string;

  @IsEnum(TransportType)
  transport!: TransportType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  source!: string;
}
