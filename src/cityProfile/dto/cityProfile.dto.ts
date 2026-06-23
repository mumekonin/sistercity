import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEmail, IsEnum, IsNotEmpty, IsNumber,IsOptional, IsString, IsUrl, ValidateNested,} from 'class-validator';
import { City } from '../../common/enum/enum';
export class BasicInfoDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  region!: string;

  @IsNotEmpty()
  @IsNumber()
  yearEstablished!: number;

  @IsNotEmpty()
  @IsNumber()
  landAreaSm2!: number;

  @IsOptional()
  @IsUrl()
  officialWebsite?: string;
}

export class PopulationDto {
  @IsNotEmpty()
  @IsNumber()
  total!: number;

  @IsNotEmpty()
  @IsNumber()
  male!: number;

  @IsNotEmpty()
  @IsNumber()
  female!: number;

  @IsNotEmpty()
  @IsNumber()
  youth!: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  lastUpdated!: Date;
}

export class KeyOfficialDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;
}

export class DepartmentDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  headName!: string;

  @IsNotEmpty()
  @IsEmail()
  headEmail!: string;
}

export class ContactInfoDto {
  @IsNotEmpty()
  @IsString()
  address!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class PartnershipHistoryDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  agreementDate!: Date;

  @IsNotEmpty()
  @IsString()
  summary!: string;
}
export class CreateCityProfileDto {
  @IsNotEmpty()
  @IsEnum(City)
  city!: City;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo!: BasicInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PopulationDto)
  population!: PopulationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyOfficialDto)
  keyOfficials!: KeyOfficialDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentDto)
  departments!: DepartmentDto[];

  @IsArray()
  @IsString({ each: true })
  areasOfFocus!: string[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo!: ContactInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PartnershipHistoryDto)
  partnershipHistory!: PartnershipHistoryDto;
}