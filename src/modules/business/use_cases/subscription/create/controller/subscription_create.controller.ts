import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SubscriptionCreateDTO } from '../dto/subscriptionCreateDTO';
import { SubscriptionViewModel } from '@modules/business/subscription/shared/view-models/subscription-view-model';
import { SubscriptionCreateService } from '../service/subscription_create.service';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('subscription')
export class SubscriptionCreateController {
  constructor(
    private readonly subscriptionCreateService: SubscriptionCreateService,
  ) {}

  @Post('create')
  public async Subscription(@Body() data: SubscriptionCreateDTO) {
    const result = await this.subscriptionCreateService.execute({
      entity_id: data.entity_id,
      plan_id: data.plan_id,
    });
    return SubscriptionViewModel.toHttp(result);
  }
}
