import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SubscriptionViewModel } from '@modules/business/subscription/shared/view-models/subscription-view-model';
import { SubscriptionGetAllService } from '../service/subscription_get_all.service';
import { SuperUserGuard } from '@modules/auth/guards/super_user_guard';

@UseGuards(AuthGuard, RolesGuard, SuperUserGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('subscription')
export class SubscriptionGetAllController {
  constructor(
    private readonly subscriptionGetAllService: SubscriptionGetAllService,
  ) {}

  @Get('get_all')
  public async Subscription() {
    const result = await this.subscriptionGetAllService.execute();
    return result.map((item) => SubscriptionViewModel.toHttp(item));
  }
}
