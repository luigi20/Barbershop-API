import { Body, Controller, Post } from '@nestjs/common';
import { GenerateMFAService } from '../services/generate-mfa-service';
import { GenerateMFADTO } from '../dto/generate-mfa-DTO';

@Controller('auth')
export class GenerateMFAController {
  constructor(private readonly generate_MFA_service: GenerateMFAService) {}

  @Post('generatemfa')
  public async GenerateMFA(@Body() data: GenerateMFADTO) {
    const result = await this.generate_MFA_service.execute({
      context_id: data.context_id,
      email: data.email,
    });
    return result;
  }
}
