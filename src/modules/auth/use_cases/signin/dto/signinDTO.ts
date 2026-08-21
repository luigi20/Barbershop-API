import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SignInDTO {
  @ApiProperty({
    description: 'E-mail utilizado para autenticação.',
    example: 'usuario@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha utilizada para autenticação.',
    example: 'Senha@123456',
  })
  @IsString()
  password: string;
}
