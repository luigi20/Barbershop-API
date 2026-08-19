import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { EntityMembershipUpdateService } from '../services/entity_membership_update.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityMembershipUpdateDTO } from '../dto/entity_membership_updateDTO';
import { Entity_Membership_View_Model } from '@modules/business/entity_membership/shared/view-models/entity-membership-view-model';
import { AuthRequest } from '@modules/utils/types/types';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_membership')
export class EntityMembershipUpdateController {
  constructor(
    private readonly entityMembershipUpdateService: EntityMembershipUpdateService,
  ) {}

  @Put('update/:id')
  public async Members(
    @Body() data: EntityMembershipUpdateDTO,
    @Req() req: AuthRequest,
  ) {
    const result = await this.entityMembershipUpdateService.execute({
      birth_date: data.birth_date,
      email: data.email,
      entity_id: data.entity_id,
      identity_id: data.identity_id,
      mfa_required: data.mfa_required,
      name: data.name,
      phone: data.phone,
      photo: data.photo,
      roles: data.roles,
      status: data.status,
      roles_auth: req.auth.roles,
    });
    return Entity_Membership_View_Model.toHttp(result);
  }
}
