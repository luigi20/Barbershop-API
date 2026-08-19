import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityViewModel } from '@modules/auth/entity/shared/view-models/entity-view-model';
import { EntityGetAllService } from '../service/entity_get_all.service';
import { SuperUserGuard } from '@modules/auth/guards/super_user_guard';

@UseGuards(AuthGuard, RolesGuard, SuperUserGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('entity')
export class EntityGetAllController {
  constructor(private readonly entityGetAllService: EntityGetAllService) {}

  @Get('get_all')
  public async EntityGetAll() {
    const result = await this.entityGetAllService.execute();
    return result.map((item) => EntityViewModel.toHttp(item));
  }
}
