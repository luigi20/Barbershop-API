import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class Select_EntityDTO {
  @ApiProperty({
    description: 'Login token obtido durante o processo de autenticação.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  login_token: string;

  @ApiProperty({
    description: 'ID da entidade que será selecionada.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  entity_id: string;
}
