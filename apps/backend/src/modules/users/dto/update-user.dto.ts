import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class UpdateUserDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsUUID()
  sectorId?: string | null;
}
