import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EntityCustomerCreateService } from '../services/entity_customer_create.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityCustomerCreateDTO } from '../dto/entity_customer_createDTO';
import { Entity_Customer_View_Model } from '@modules/business/entity_customer/shared/view-models/entity-customer-view-model';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_customer')
export class EntityCustomerCreateController {
  constructor(
    private readonly entityCustomerCreateService: EntityCustomerCreateService,
  ) {}

  @Post('create')
  public async Members(@Body() data: EntityCustomerCreateDTO) {
    const result = await this.entityCustomerCreateService.execute({
      birth_date: data.birth_date,
      email: data.email,
      entity_id: data.entity_id,
      mfa_required: data.mfa_required,
      name: data.name,
      password: data.password,
      phone: data.phone,
      photo: data.photo,
      notes: data.notes,
    });
    return Entity_Customer_View_Model.toHttp(result);
  }
}
