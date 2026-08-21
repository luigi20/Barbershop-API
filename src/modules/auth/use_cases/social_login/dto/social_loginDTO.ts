import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class Social_LoginDTO {
  @ApiProperty({
    description: 'Provedor de autenticação social.',
    example: 'google',
  })
  @IsString()
  provider: string;

  @ApiProperty({
    description: 'Token fornecido pelo provedor de autenticação.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  token: string;
}
