import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EntityCustomerGetAllService } from '../services/entity_customer_get_all.service';
import { AuthRequest } from '@modules/utils/types/types';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { Entity_Customer_View_Model } from '@modules/business/entity_customer/shared/view-models/entity-customer-view-model';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_customer')
export class EntityCustomerGetAllController {
  constructor(
    private readonly entityCustomerGetAllService: EntityCustomerGetAllService,
  ) {}

  @Get('get_all')
  public async Members(@Req() req: AuthRequest) {
    const result = await this.entityCustomerGetAllService.execute({
      entity_id: req.auth.entity_id,
      is_superuser: req.auth.is_superuser,
    });
    return result.map((item) => Entity_Customer_View_Model.toHttp(item));
  }
}
