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
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('auth')
export class LogoutController {
  constructor(private readonly logout_service: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async Logout(@Body() data: LogoutDTO) {
    const token = await this.logout_service.execute(data.refresh_token);
    return token;
  }
}
