import {
  IsEnum,
  ArrayNotEmpty,
  ArrayUnique,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsString } from 'class-validator';
import { MemberRole } from '@modules/utils/enum';

export class EntityMembershipCreateDTO {
  @ApiProperty({
    description: 'Data de nascimento do membro.',
    example: '1995-05-20',
  })
  @IsDateString()
  birth_date: string;

  @ApiProperty({
    description: 'E-mail do membro.',
    example: 'funcionario@barbearia.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'ID da entidade.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiProperty({
    description: 'Define se o membro utilizará MFA.',
    example: true,
  })
  @IsBoolean()
  mfa_required: boolean;

  @ApiProperty({
    description: 'Nome completo do membro.',
    example: 'João da Silva',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Senha inicial do membro.',
    example: 'Senha@123456',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Telefone do membro.',
    example: '+5579999999999',
  })
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    description: 'URL da foto do membro.',
    example: 'https://ik.imagekit.io/seu_usuario/profile.jpg',
  })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty({
    description: 'Roles atribuídas ao membro.',
    enum: MemberRole,
    isArray: true,
    example: [MemberRole.BARBEIRO],
  })
  @IsEnum(MemberRole, { each: true })
  @IsIn(
    [MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA, MemberRole.BARBEIRO],
    { each: true },
  )
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsArray()
  roles: MemberRole[];
}
