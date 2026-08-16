import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LogoutService } from '../service/logout.service';
import { LogoutDTO } from '../dto/logoutDTO';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('auth')
@Roles(
  MemberRole.DONO,
  MemberRole.ADMINISTRADOR,
  MemberRole.RECEPCIONISTA,
  MemberRole.CLIENTE,
  MemberRole.BARBEIRO,
)
export class LogoutController {
  constructor(private readonly logout_service: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async Logout(@Body() data: LogoutDTO) {
    const token = await this.logout_service.execute(data.refresh_token);
    return token;
  }
}
