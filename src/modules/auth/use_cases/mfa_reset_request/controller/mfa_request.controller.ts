import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MFARequestDTO } from '../dto/mfa_requestDTO';
import { MFARequestService } from '../service/mfa_request.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.MFA, TokenType.LOGIN)
@Controller('auth')
export class MFARequestController {
  constructor(private readonly mfaRequestService: MFARequestService) {}

  @Post('mfarequest')
  public async MFARequest(@Body() data: MFARequestDTO) {
    const result = await this.mfaRequestService.execute({
      email: data.email,
    });
    return result;
  }
}
