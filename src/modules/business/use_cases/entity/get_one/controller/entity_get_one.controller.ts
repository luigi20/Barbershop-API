import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityGetOneService } from '../service/entity_get_one.service';
import { EntityViewModel } from '@modules/auth/entity/shared/view-models/entity-view-model';
import { AuthRequest } from '@modules/utils/types/types';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(
  MemberRole.ADMINISTRADOR,
  MemberRole.CLIENTE,
  MemberRole.BARBEIRO,
  MemberRole.RECEPCIONISTA,
)
@Controller('entity')
export class EntityGetOneController {
  constructor(private readonly entityGetOneService: EntityGetOneService) {}

  @Get('get_one/:id')
  public async PlanGetAll(@Param('id') id: string, @Req() req: AuthRequest) {
    const result = await this.entityGetOneService.execute({
      id: id,
    });
    return EntityViewModel.toHttp(result);
  }
}
