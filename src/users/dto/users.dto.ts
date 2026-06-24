// dto/create-user.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role, City, Department } from "../../common/enum/enum";

export class CreateUserDto {
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
  @IsEnum(Department)
  department?: Department;
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
export class UpdateUserDto {
  fullName?: string;
  email?: string;
  jobTitle?: string;
  department?: Department;
  phone?: string;
  city?: City;
  role?: Role;
  isActive?: boolean;
}
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmNewPassword!: string;
}