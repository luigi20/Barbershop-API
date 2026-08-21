import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Profile_View_Model } from '@modules/auth/profile/shared/view-models/profile-view-model';
import { AuthRequest } from '@modules/utils/types/types';
import { ChangeProfileService } from '../service/change_profile.service';
import { ChangeProfileDTO } from '../dto/change-profile-DTO';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(
  MemberRole.ADMINISTRADOR,
  MemberRole.RECEPCIONISTA,
  MemberRole.CLIENTE,
  MemberRole.BARBEIRO,
)
@Controller('auth')
export class ChangeProfileController {
  constructor(private readonly change_profile_service: ChangeProfileService) {}

  @Put('change_profile')
  @ApiTags('Profile')
  @ApiOperation({
    summary: 'Alterar perfil',
    description: 'Atualiza os dados do perfil do usuário autenticado.',
  })
  @ApiBody({
    type: ChangeProfileDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, expirado ou ausente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para alterar o perfil.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados enviados são inválidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil não existe.',
  })
  public async ChangeProfile(
    @Req() req: AuthRequest,
    @Body() data: ChangeProfileDTO,
  ) {
    const result = await this.change_profile_service.execute({
      profile_id: req.auth.profile_id,
      name: data.name,
      photo_url: data.photo_url,
      birth_date: data.birth_date,
      phone: data.phone,
    });

    return Profile_View_Model.toHttp(result);
  }
}
