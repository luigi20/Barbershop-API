import { Body, Controller, Post } from '@nestjs/common';
import { MFAConfirmDTO } from '../dto/mfa_confirmDTO';
import { MFAConfirmService } from '../service/mfa_confirm.service';

@Controller('auth')
export class MFAConfirmController {
  constructor(private readonly mfaConfirmService: MFAConfirmService) {}

  @Post('mfa/confirm')
  public async MFAConfirm(@Body() data: MFAConfirmDTO) {
    const result = await this.mfaConfirmService.execute({
      email: data.email,
      mfa_code: data.mfa_code,
    });
    return result;
  }
}
