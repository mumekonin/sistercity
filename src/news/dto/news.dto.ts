import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsMongoId, IsArray, IsIn, } from 'class-validator';
import { NewsCategory } from '../../common/enum/enum';
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
  isPublic!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isJoint!: boolean;

  @IsOptional()
  @IsMongoId()
  relatedProject?: string;
}

export class UpdateNewsDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['approve', 'reject', 'publish', 'unpublish'])
  action!: 'approve' | 'reject' | 'publish' | 'unpublish';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}