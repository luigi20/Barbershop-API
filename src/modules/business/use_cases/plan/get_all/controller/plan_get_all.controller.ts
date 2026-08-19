import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { PlanViewModel } from '@modules/business/plan/shared/view-models/plan-view-model';
import { PlanGetAllService } from '../service/plan_get_all.service';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('plan')
export class PlanGetAllController {
  constructor(private readonly planGetAllService: PlanGetAllService) {}

  @Get('get_all')
  public async PlanGetAll() {
    const result = await this.planGetAllService.execute();
    return result.map((item) => PlanViewModel.toHttp(item));
  }
}
