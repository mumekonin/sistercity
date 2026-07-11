import { IsString, IsNotEmpty, IsEnum, IsNumber, IsDate, IsOptional, Min, } from 'class-validator';
import { Type } from 'class-transformer';
import { EquipmentStatus } from '../../common/enum/enum';

export class CreateEquipmentDto {

  @IsString()
  @IsNotEmpty()
  itemName!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(1)
  estimatedValue!: number;

  @IsDate()
  @Type(() => Date)
  providedDate!: Date;
}
export class UpdateEquipmentDto {
  @IsEnum(EquipmentStatus)
  @IsNotEmpty()
  status!: EquipmentStatus;

  @IsOptional()
  @IsString()
  damagedNote?: string;
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  returnedDate?: Date;
}