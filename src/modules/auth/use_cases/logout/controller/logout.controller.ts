import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LogoutService } from '../service/logout.service';
import { LogoutDTO } from '../dto/logoutDTO';

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
