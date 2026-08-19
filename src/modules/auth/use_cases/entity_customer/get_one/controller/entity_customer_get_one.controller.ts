import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '@modules/utils/types/types';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityCustomerGetOneService } from '../services/entity_customer_get_one.service';
import { Entity_Customer_View_Model } from '@modules/auth/entity_customer/shared/view-models/entity-customer-view-model';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.DONO, MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_customer')
export class EntityCustomerGetOneController {
  constructor(
    private readonly entityCustomerGetOneService: EntityCustomerGetOneService,
  ) {}

  @Get('get_one')
  public async Members(
    @Req() req: AuthRequest,
    @Query('entity_id') entity_id: string,
    @Query('profile_id') profile_id: string,
  ) {
    const result = await this.entityCustomerGetOneService.execute({
      entity_id_user: req.auth.entity_id,
      is_superuser: req.auth.is_superuser,
      entity_id: entity_id,
      profile_id: profile_id,
    });
    return Entity_Customer_View_Model.toHttp(result);
  }
}
