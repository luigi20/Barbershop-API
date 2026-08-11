import { Body, Controller, Post } from '@nestjs/common';
import { MFARequestDTO } from '../dto/mfa_requestDTO';
import { MFARequestService } from '../service/mfa_request.service';

@Controller('auth')
export class MFARequestController {
  constructor(private readonly mfaRequestService: MFARequestService) {}

  @Post('mfarequest')
  public async MFARequest(@Body() data: MFARequestDTO) {
    const result = await this.mfaRequestService.execute({
      email: data.email,
      context_id: data.context_id,
    });
    return result;
  }
}
