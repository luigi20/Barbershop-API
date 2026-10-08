import { Req as AuthenticatedRequest } from '@nestjs/common';
import { AuthRequest } from '@modules/utils/types/types';
import { matchingToken } from '@modules/auth/security/request-security';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SelectEntityService } from '../service/select_entity.service';
import { Select_EntityDTO } from '../dto/select_entityDTO';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';
import { AuthGuardChallenge } from '@modules/auth/guards/auth_guard_challenge';

@ApiTags('Auth')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuardChallenge)
@TokenTypeRequired(TokenType.CHALLENGE)
@Controller('auth')
export class SelectEntityController {
  constructor(private readonly selectEntityService: SelectEntityService) {}

  @Post('select-entity')
  @ApiOperation({
    summary: 'Selecionar entidade',
    description:
      'Seleciona a entidade que será utilizada na sessão do usuário.',
  })
  @ApiResponse({
    status: 201,
    description: 'Entidade selecionada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Entidade inválida ou dados da requisição inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de desafio inválido, expirado ou ausente.',
  })
  public async SelectEntity(
    @AuthenticatedRequest() req: AuthRequest,
    @Body() data: Select_EntityDTO,
  ) {
    const result = await this.selectEntityService.execute({
      login_token: matchingToken(req, data.login_token),
      entity_id: data.entity_id,
    });
    return result;
  }
}
