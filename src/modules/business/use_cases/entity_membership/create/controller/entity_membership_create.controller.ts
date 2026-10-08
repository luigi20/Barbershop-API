import { Req as AuthenticatedRequest } from '@nestjs/common';
import { AuthRequest } from '@modules/utils/types/types';
import { tenantId } from '@modules/auth/security/request-security';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EntityMembershipCreateService } from '../services/entity_membership_create.service';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { EntityMembershipCreateDTO } from '../dto/entity_membership_createDTO';
import { Entity_Membership_View_Model } from '@modules/business/entity_membership/shared/view-models/entity-membership-view-model';
import { AuthGuardAccess } from '@modules/auth/guards/auth_guard_access';
import { UseFilters } from '@nestjs/common';
import { ManagementAppErrorFilter } from '../../../management-app-error.filter';

@ApiTags('Entity Membership')
@UseFilters(ManagementAppErrorFilter)
@ApiBearerAuth('access-token')
@UseGuards(AuthGuardAccess, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
@Controller('entity_membership')
export class EntityMembershipCreateController {
  constructor(
    private readonly entityMembershipCreateService: EntityMembershipCreateService,
  ) {}

  @Post('create')
  @ApiOperation({
    summary: 'Criar membro',
    description: 'Cria um novo membro e vincula o perfil à entidade.',
  })
  @ApiBody({
    type: EntityMembershipCreateDTO,
  })
  @ApiResponse({
    status: 201,
    description: 'Membro criado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados do membro inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido, expirado ou ausente.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Usuário não possui permissão de administrador ou recepcionista.',
  })
  @ApiResponse({
    status: 409,
    description: 'Membro já cadastrado.',
  })
  public async Members(
    @AuthenticatedRequest() req: AuthRequest,
    @Body() data: EntityMembershipCreateDTO,
  ) {
    const result = await this.entityMembershipCreateService.execute({
      birth_date: data.birth_date,
      email: data.email,
      entity_id: tenantId(req.auth, data.entity_id ?? req.auth.entity_id),
      mfa_required: data.mfa_required,
      name: data.name,
      password: data.password,
      phone: data.phone,
      photo: data.photo,
      roles: data.roles,
      roles_auth: req.auth.roles,
    });

    return Entity_Membership_View_Model.toHttp(result);
  }
}
