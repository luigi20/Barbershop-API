import { IsString, IsUUID } from 'class-validator';

export class SubscriptionCreateDTO {
  @IsUUID()
  entity_id: string;

  @IsUUID()
  plan_id: string;
}
