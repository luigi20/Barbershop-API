import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '@modules/utils/types/types';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { Entity_Membership_View_Model } from '@modules/business/entity_membership/shared/view-models/entity-membership-view-model';
import { EntityMembershipGetOneService } from '../services/entity_membership_get_one.service';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.DONO, MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_membership')
export class EntityMembershipGetOneController {
  constructor(
    private readonly entityMembershipGetOneService: EntityMembershipGetOneService,
  ) {}

  @Get()
  public async Members(
    @Req() req: AuthRequest,
    @Query('entity_id') entity_id: string,
    @Query('profile_id') profile_id: string,
  ) {
    const result = await this.entityMembershipGetOneService.execute({
      entity_id_user: req.auth.entity_id,
      is_superuser: req.auth.is_superuser,
      entity_id: entity_id,
      profile_id: profile_id,
    });
    return Entity_Membership_View_Model.toHttp(result);
  }
}
