import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AuthDtoSignUp {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;
}

export class DtoUpdateUserInfo {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;
}

export class AuthDtoSignIn {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class DtoUrl {
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;
}

export class JwtDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class twoFAuthDto {
  @IsString()
  @IsNotEmpty()
  twoFAuthCode: string;
}
