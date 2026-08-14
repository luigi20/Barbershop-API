import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MFAConfirmDTO } from '../dto/mfa_confirmDTO';
import { MFAConfirmService } from '../service/mfa_confirm.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.MFA)
@Controller('auth')
export class MFAConfirmController {
  constructor(private readonly mfaConfirmService: MFAConfirmService) {}

  @Post('mfa/confirm')
  public async MFAConfirm(@Body() data: MFAConfirmDTO) {
    const result = await this.mfaConfirmService.execute({
      email: data.email,
      mfa_code: data.mfa_code,
      enabled_mfa: data.enabled_MFA,
    });
    return result;
  }
}
