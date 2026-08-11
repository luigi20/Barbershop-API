import { Body, Controller, Post } from '@nestjs/common';
import { ValidateMFAService } from '../services/validate-MFA-service';
import { ValidateMFADTO } from '../dto/validate-mfa-DTO';

@Controller('auth')
export class ValidateMFAController {
  constructor(private readonly validate_MFA_service: ValidateMFAService) {}

  @Post('validatemfa')
  public async GenerateMFA(@Body() data: ValidateMFADTO) {
    const result = await this.validate_MFA_service.execute({
      context_id: data.context_id,
      code: data.code,
      entity_id: data.entity_id,
      mfa_token: data.token,
      
    });
    return result;
  }
}
