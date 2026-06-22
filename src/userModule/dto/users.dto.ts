// dto/create-user.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role, City } from "../../common/enum/enum";

export class CreateUserDto{
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role!: Role;

  @IsNotEmpty()
  @IsEnum(City)
  city!: City;

  @IsOptional()
  @IsString()
  department?: string;

  @IsNotEmpty()
  @IsString()
  jobTitle!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginUserDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}