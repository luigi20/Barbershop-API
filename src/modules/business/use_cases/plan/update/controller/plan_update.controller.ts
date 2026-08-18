import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SuperUserGuard } from '@modules/auth/guards/super_user_guard';
import { PlanViewModel } from '@modules/business/plan/shared/view-models/plan-view-model';
import { PlanUpdateService } from '../service/plan_update.service';
import { PlanUpdateDTO } from '../dto/planUpdateDTO';

@UseGuards(AuthGuard, RolesGuard, SuperUserGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('plan')
export class PlanUpdateController {
  constructor(private readonly planUpdateService: PlanUpdateService) {}

  @Put(':id')
  public async PlanUpdate(
    @Body() data: PlanUpdateDTO,
    @Param('id') id: string,
  ) {
    const result = await this.planUpdateService.execute({
      active: data.active,
      max_appointments: data.max_appointments,
      max_customers: data.max_customers,
      max_members: data.max_members,
      name: data.name,
      price: data.price,
      description: data.description ? data.description : null,
      id: id,
    });
    return PlanViewModel.toHttp(result);
  }
}
