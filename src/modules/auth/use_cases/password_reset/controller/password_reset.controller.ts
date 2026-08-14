import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PasswordResetDTO } from '../dto/password_resetDTO';
import { PasswordResetService } from '../service/password_reset.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @UseGuards(AuthGuard)
  @TokenTypeRequired(TokenType.CHALLENGE)
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
