import { IsString, IsUUID } from 'class-validator';

export class SubscriptionUpdateDTO {
  @IsUUID()
  entity_id: string;

  @IsUUID()
  plan_id: string;

  @IsString()
  status: string;
}
