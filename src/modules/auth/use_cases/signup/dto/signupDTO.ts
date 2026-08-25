import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class SignUpDTO {
  @ApiProperty({
    description: 'E-mail do usuário.',
    example: 'usuario@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nome do usuário.',
    example: 'Luís Antonio',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Senha da conta.',
    example: 'Senha@123456',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Nome da entidade que será criada.',
    example: 'Barbearia do Luís',
  })
  @IsString()
  entity_name: string;

  @ApiProperty({
    description: 'Data de nascimento.',
    example: '1995-05-20',
  })
  @IsDateString()
  birth_date: string;

  @ApiProperty({
    description: 'Telefone do usuário.',
    example: '+5579999999999',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'URL da foto do perfil.',
    example: 'https://ik.imagekit.io/seu_usuario/profile.jpg',
  })
  @IsString()
  photo: string;

  @ApiProperty({
    description: 'Tipo da entidade.',
    example: 'BARBERSHOP',
  })
  @IsString()
  entity_type: string;

  @ApiProperty({
    description: 'Documento da entidade.',
    example: '12345678000199',
  })
  @IsString()
  document: string;

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
