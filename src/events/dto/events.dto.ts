import {  IsString , IsNotEmpty, IsEnum,IsOptional,IsBoolean,IsMongoId,IsArray,IsNumber,IsDate,ValidateNested,IsIn,Min} from 'class-validator';
import { Type } from 'class-transformer';
import {City,EventType} from '../../common/enum/enum';
export class AgendaItemDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;
}

export class MinutesDto {
  @IsNotEmpty()
  @IsString()
  summary!: string;

  @IsArray()
  @IsString({ each: true })
  decisions!: string[];
}

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsEnum(EventType)
  eventType!: EventType;

  @IsNotEmpty()
  @IsEnum(City)
  hostCity!: City;

  @IsNotEmpty()
  @IsString()
  venue!: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @IsNotEmpty()
  @IsBoolean()
  isPublic!: boolean;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsMongoId()
  relatedProject?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda?: AgendaItemDto[];
}

export class UpdateEventDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['update', 'cancel', 'add-agenda', 'upload-minutes'])
  action!: 'update' | 'cancel' | 'add-agenda' | 'upload-minutes';

  // for update action
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  relatedProject?: string;

  // for add-agenda action
  @IsOptional()
  @ValidateNested()
  @Type(() => AgendaItemDto)
  agendaItem?: AgendaItemDto;

  // for upload-minutes action
  @IsOptional()
  @ValidateNested()
  @Type(() => MinutesDto)
  minutes?: MinutesDto;
}

export class ConfirmMinutesDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['upload', 'confirm'])
  action!: 'upload' | 'confirm';

  @IsOptional()
  @ValidateNested()
  @Type(() => MinutesDto)
  minutes?: MinutesDto;
}