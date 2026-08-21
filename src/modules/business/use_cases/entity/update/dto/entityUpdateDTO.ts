import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EntityUpdateDTO {
  @ApiProperty({
    description: 'Status atual da entidade.',
    example: 'ACTIVE',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Documento da entidade.',
    example: '12345678000199',
  })
  @IsString()
  document: string;

  @ApiProperty({
    description: 'E-mail da entidade.',
    example: 'contato@barbearia.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Telefone da entidade.',
    example: '+5579999999999',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Nome da entidade.',
    example: 'Barbearia do Luís',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL da foto da entidade.',
    example: 'https://ik.imagekit.io/seu_usuario/barbearia.jpg',
  })
  @IsString()
  photo: string;

  @ApiProperty({
    description: 'Tipo da entidade.',
    example: 'BARBERSHOP',
  })
  @IsString()
  type: string;
}
