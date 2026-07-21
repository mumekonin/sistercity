import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenditureCategory } from '../../common/enum/enum';
export class CreateExpenditureDto {
  @IsEnum(ExpenditureCategory)
  @IsNotEmpty()
  category!: ExpenditureCategory;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount!: number;

  @IsDate()
  @Type(() => Date)
  date!: Date;
}

export class UpdateExpenditureDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['approve', 'reject'])
  action!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
