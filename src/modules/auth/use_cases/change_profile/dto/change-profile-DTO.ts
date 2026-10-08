import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ChangeProfileDTO {
  @ApiPropertyOptional({
    description: 'Nome do usuário',
    example: 'Luís Antonio',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'URL da foto do perfil',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsOptional()
  photo_url?: string | null;

  @ApiPropertyOptional({
    description: 'Data de nascimento',
    example: '1995-05-20',
  })
  @IsOptional()
  @IsDateString()
  birth_date?: string | null;

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '+5579999999999',
  })
  @IsString()
  @IsOptional()
  phone?: string | null;
}
