import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GenerateMFAService } from '../services/generate-mfa-service';
import { GenerateMFADTO } from '../dto/generate-mfa-DTO';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.CHALLENGE, TokenType.MFA)
@Controller('auth')
export class GenerateMFAController {
  constructor(private readonly generate_MFA_service: GenerateMFAService) {}

  @Post('generatemfa')
  public async GenerateMFA(@Body() data: GenerateMFADTO) {
    const result = await this.generate_MFA_service.execute({
      email: data.email,
      type: data.type,
    });
    return result;
  }
}
