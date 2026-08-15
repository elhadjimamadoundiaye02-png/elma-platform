import { IsEmail, IsString, MinLength, IsPhoneNumber, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('SN')
  telephone: string;

  @IsString()
  @MinLength(8)
  motDePasse: string;

  @IsOptional()
  @IsString()
  adresse?: string;
}
