import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetRequestDTO } from '../dto/password_reset_requestDTO';
import { PasswordResetRequestService } from '../service/password_reset_request.service';

@Controller('auth')
export class PasswordResetRequestController {
  constructor(
    private readonly passwordResetRequestService: PasswordResetRequestService,
  ) {}

  @Post('passwordresetrequest')
  public async PasswordResetRequest(@Body() data: PasswordResetRequestDTO) {
    const result = await this.passwordResetRequestService.execute({
      email: data.email,
    });
    return result;
  }
}
