import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JWKSService } from '../service/jwks.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@ApiTags('Auth')
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
export class JWKSController {
  constructor(private readonly JWKS_Service: JWKSService) {}

  @Post('jwks')
  @ApiOperation({
    summary: 'Obter chaves públicas JWT',
    description:
      'Retorna as chaves públicas utilizadas para validação dos tokens JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Chaves públicas retornadas com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, expirado ou ausente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para acessar este recurso.',
  })
  public async JWKS() {
    const result = await this.JWKS_Service.execute();
    return result;
  }
}
