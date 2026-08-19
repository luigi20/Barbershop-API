import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { SuperUserGuard } from '@modules/auth/guards/super_user_guard';
import { EntityUpdateDTO } from '../dto/entityUpdateDTO';
import { EntityUpdateService } from '../service/entity_update.service';
import { EntityViewModel } from '@modules/auth/entity/shared/view-models/entity-view-model';

@UseGuards(AuthGuard, RolesGuard, SuperUserGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR)
@Controller('entity')
export class EntityUpdateController {
  constructor(private readonly entityUpdateService: EntityUpdateService) {}

  @Put('update/:id')
  public async EntityUpdate(
    @Body() data: EntityUpdateDTO,
    @Param('id') id: string,
  ) {
    const result = await this.entityUpdateService.execute({
      status: data.status,
      document: data.document,
      email: data.email,
      phone: data.phone,
      name: data.name,
      photo: data.photo,
      type: data.type,
      id: id,
    });
    return EntityViewModel.toHttp(result);
  }
}
