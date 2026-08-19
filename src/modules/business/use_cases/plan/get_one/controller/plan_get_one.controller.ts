import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { PlanViewModel } from '@modules/business/plan/shared/view-models/plan-view-model';
import { PlanGetOneService } from '../service/plan_get_one.service';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('plan')
export class PlanGetOneController {
  constructor(private readonly planGetOneService: PlanGetOneService) {}

  @Get('get_one/:id')
  public async PlanGetAll(@Param('id') id: string) {
    const result = await this.planGetOneService.execute(id);
    return PlanViewModel.toHttp(result);
  }
}
