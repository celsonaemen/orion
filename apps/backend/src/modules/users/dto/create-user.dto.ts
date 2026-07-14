import { Transform } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { UserStatus } from "@prisma/client";

export class CreateUserDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUUID()
  sectorId?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
