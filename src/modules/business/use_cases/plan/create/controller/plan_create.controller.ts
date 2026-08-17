import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlanCreateService } from '../service/plan_create.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SuperUserGuard } from '@modules/auth/guards/super_user_guard';
import { PlanViewModel } from '@modules/business/plan/shared/view-models/plan-view-model';
import { PlanCreateDTO } from '../dto/planCreateDTO';

@UseGuards(AuthGuard, RolesGuard, SuperUserGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('plan')
export class PlanCreateController {
  constructor(private readonly planService: PlanCreateService) {}

  @Post()
  public async SignIn(@Body() data: PlanCreateDTO) {
    const result = await this.planService.execute({
      active: data.active,
      max_appointments: data.max_appointments,
      max_customers: data.max_customers,
      max_members: data.max_members,
      name: data.name,
      price: data.price,
      description: data.description ? data.description : null,
    });
    return PlanViewModel.toHttp(result);
  }
}
