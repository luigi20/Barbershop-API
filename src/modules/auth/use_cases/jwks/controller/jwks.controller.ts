import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JWKSService } from '../service/jwks.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Roles(
  MemberRole.DONO,
  MemberRole.ADMINISTRADOR,
  MemberRole.RECEPCIONISTA,
  MemberRole.CLIENTE,
  MemberRole.BARBEIRO,
)
@Controller('auth')
export class JWKSController {
  constructor(private readonly JWKS_Service: JWKSService) {}

  @Post('jwks')
  public async JWKS() {
    const result = await this.JWKS_Service.execute();
    return result;
  }
}
