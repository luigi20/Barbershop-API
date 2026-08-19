import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { EntityCustomerUpdateService } from '../services/entity_customer_update.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityCustomerUpdateDTO } from '../dto/entity_customer_updateDTO';
import { Entity_Customer_View_Model } from '@modules/business/entity_customer/shared/view-models/entity-customer-view-model';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_customer')
export class EntityCustomerUpdateController {
  constructor(
    private readonly entityCustomerUpdateService: EntityCustomerUpdateService,
  ) {}

  @Put('update/:id')
  public async Members(@Body() data: EntityCustomerUpdateDTO) {
    const result = await this.entityCustomerUpdateService.execute({
      birth_date: data.birth_date,
      email: data.email,
      entity_id: data.entity_id,
      mfa_required: data.mfa_required,
      name: data.name,
      phone: data.phone,
      photo: data.photo,
      notes: data.notes,
      status: data.status,
    });
    return Entity_Customer_View_Model.toHttp(result);
  }
}
