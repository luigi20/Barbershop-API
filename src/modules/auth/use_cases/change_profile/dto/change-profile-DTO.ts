import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangeProfileDTO {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'Luís Antonio',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL da foto do perfil',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  photo_url: string;

  @ApiProperty({
    description: 'Data de nascimento',
    example: '1995-05-20',
  })
  @IsString()
  birth_date: string;

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '+5579999999999',
  })
  @IsString()
  phone: string;
}
