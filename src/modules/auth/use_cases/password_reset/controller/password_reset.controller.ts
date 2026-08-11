import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetDTO } from '../dto/password_resetDTO';
import { PasswordResetService } from '../service/password_reset.service';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('passwordreset')
  public async PasswordReset(@Body() data: PasswordResetDTO) {
    const result = await this.passwordResetService.execute({
      email: data.email,
      new_password: data.new_password,
      token: data.token,
    });
    return result;
  }
}
