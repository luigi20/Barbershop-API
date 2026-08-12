import { Body, Controller, Post, Req } from '@nestjs/common';
import { ValidateMFAService } from '../services/validate-MFA-service';
import { ValidateMFADTO } from '../dto/validate-mfa-DTO';
import { AuthRequest } from '@modules/utils/types/types';

@Controller('auth')
export class ValidateMFAController {
  constructor(private readonly validate_MFA_service: ValidateMFAService) {}

  @Post('validatemfa')
  public async GenerateMFA(
    @Body() data: ValidateMFADTO,
    @Req() req: AuthRequest,
  ) {
    const result = await this.validate_MFA_service.execute({
      code: data.code,
      mfa_token: data.token,
      entity_id: req.auth.entity_id,
    });
    return result;
  }
}
