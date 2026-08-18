import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SubscriptionUpdateDTO } from '../dto/subscriptionUpdateDTO';
import { SubscriptionViewModel } from '@modules/business/subscription/shared/view-models/subscription-view-model';
import { SubscriptionUpdateService } from '../service/subscription_update.service';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('subscription')
export class SubscriptionUpdateController {
  constructor(
    private readonly subscriptionUpdateService: SubscriptionUpdateService,
  ) {}

  @Put(':id')
  public async Subscription(
    @Body() data: SubscriptionUpdateDTO,
    @Param('id') id: string,
  ) {
    const result = await this.subscriptionUpdateService.execute({
      entity_id: data.entity_id,
      plan_id: data.plan_id,
      status: data.status,
      id: id,
    });
    return SubscriptionViewModel.toHttp(result);
  }
}
