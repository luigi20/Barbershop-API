import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { EntityStatus, EntityType } from '@modules/utils/enum';

export class EntityUpdateDTO {
  @ApiPropertyOptional({
    description: 'Status atual da entidade.',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional({
    description: 'Documento da entidade.',
    example: '12345678000199',
  })
  @IsOptional()
  @IsString()
  document?: string | null;

  @ApiPropertyOptional({
    description: 'E-mail da entidade.',
    example: 'contato@barbearia.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Telefone da entidade.',
    example: '+5579999999999',
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({
    description: 'Nome da entidade.',
    example: 'Barbearia do Luís',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'URL da foto da entidade.',
    example: 'https://ik.imagekit.io/seu_usuario/barbearia.jpg',
  })
  @IsOptional()
  @IsString()
  photo?: string | null;

  @ApiProperty({
    description: 'Tipo da entidade.',
    example: 'BARBERSHOP',
  })
  @IsEnum(EntityType)
  type: EntityType;

  @ApiProperty({
    description: 'CEP do endereço da entidade.',
    example: '49000-000',
  })
  @IsString()
  zip_code: string;

  @ApiProperty({
    description: 'Rua do endereço da entidade.',
    example: 'Rua João Pessoa',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'Número do endereço da entidade.',
    example: '123',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'Complemento do endereço da entidade.',
    example: 'Sala 2',
    required: false,
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({
    description: 'Bairro do endereço da entidade.',
    example: 'Centro',
  })
  @IsString()
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade do endereço da entidade.',
    example: 'Aracaju',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Estado do endereço da entidade.',
    example: 'SE',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'País do endereço da entidade.',
    example: 'BR',
  })
  @IsString()
  country: string;
}
