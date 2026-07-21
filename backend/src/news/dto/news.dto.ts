import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsArray,
  IsIn,
} from 'class-validator';
import { NewsCategory } from '../../common/enum/enum';
import { Transform } from 'class-transformer';
export class CreateNewsDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsEnum(NewsCategory)
  category!: NewsCategory;

  @IsNotEmpty()
  @IsString()
  body!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isJoint!: boolean;

  @IsOptional()
  @IsMongoId()
  relatedProject?: string;
}

export class UpdateNewsDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['approve', 'reject', 'publish', 'unpublish', 'edit'])
  action!: 'approve' | 'reject' | 'publish' | 'unpublish' | 'edit';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(NewsCategory)
  category?: NewsCategory;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic?: boolean;
}
