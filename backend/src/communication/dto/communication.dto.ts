import {  IsString, IsNotEmpty, IsEnum, IsOptional, IsMongoId, IsArray, ValidateNested, IsIn} from 'class-validator';
import { Type } from 'class-transformer';
import {City,MessageType,MessagePriority} from '../../common/enum/enum';
export class MessageToDto {
  @IsNotEmpty()
  @IsEnum(City)
  city!: City;

  @IsNotEmpty()
  @IsString()
  department!: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}

export class AttachmentDto {
  @IsOptional()
  @IsMongoId()
  documentId?: string;

  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @IsNotEmpty()
  @IsString()
  fileUrl!: string;
}
export class CreateMessageDto {
  @IsNotEmpty()
  @IsEnum(MessageType)
  messageType!: MessageType;

  @IsNotEmpty()
  @IsEnum(MessagePriority)
  priority!: MessagePriority;

  @IsNotEmpty()
  @IsString()
  subject!: string;

  @IsNotEmpty()
  @IsString()
  body!: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageToDto)
  to!: MessageToDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsMongoId()
  relatedProject?: string;
}

export class ReplyMessageDto {
  @IsNotEmpty()
  @IsString()
  body!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class UpdateMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['escalate', 'close'])
  action!: 'escalate' | 'close';
}