import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsMongoId,
  IsDate,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DocumentCategory,
  AccessLevel,
  DocumentApprovalStatus,
} from '../../common/enum/enum';
export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
  @IsEnum(DocumentCategory)
  @IsNotEmpty()
  category!: DocumentCategory;
  @IsOptional()
  @IsMongoId()
  relatedProject?: string;
  @IsDate()
  @Type(() => Date)
  documentDate!: Date;
  @IsString()
  @IsNotEmpty()
  description!: string;
  @IsEnum(AccessLevel)
  @IsNotEmpty()
  accessLevel!: AccessLevel;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;
}
export class UpdateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['approve', 'reject', 'archive', 'change-access'])
  action!: 'approve' | 'reject' | 'archive' | 'change-access';
  @IsOptional()
  @IsString()
  approvalNote?: string;
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;
}
export class UploadNewVersionDto {
  @IsOptional()
  @IsString()
  changeNote?: string;
}
