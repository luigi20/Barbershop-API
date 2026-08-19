import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SubscriptionViewModel } from '@modules/business/subscription/shared/view-models/subscription-view-model';
import { SubscriptionGetOneService } from '../service/subscription_get_one.service';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('subscription')
export class SubscriptionGetOneController {
  constructor(
    private readonly subscriptionGetOneService: SubscriptionGetOneService,
  ) {}

  @Get('get_one/:id')
  public async Subscription(@Param('id') id: string) {
    const result = await this.subscriptionGetOneService.execute(id);
    return SubscriptionViewModel.toHttp(result);
  }
}
