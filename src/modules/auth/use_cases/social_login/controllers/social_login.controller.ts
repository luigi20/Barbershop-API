import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AuthSocialLoginService } from '../services/auth_social_login.service';
import { Social_LoginDTO } from '../dto/social_loginDTO';

@Controller('auth')
export class AuthSocialLoginController {
  constructor(
    private readonly authSocialLoginService: AuthSocialLoginService,
  ) {}

  @Post('social_login')
  @HttpCode(HttpStatus.OK)
  async google_login(@Body() data: Social_LoginDTO) {
    return this.authSocialLoginService.execute({
      provider: data.provider,
      token: data.token,
    });
  }
}
