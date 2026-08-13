import { IsString, IsUUID } from 'class-validator';

export class Select_EntityDTO {
  @IsString()
  login_token: string;

  @IsUUID()
  entity_id: string;
}
