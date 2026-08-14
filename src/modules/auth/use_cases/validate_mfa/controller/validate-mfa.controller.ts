import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ValidateMFAService } from '../services/validate-MFA-service';
import { ValidateMFADTO } from '../dto/validate-mfa-DTO';
import { AuthRequest } from '@modules/utils/types/types';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.CHALLENGE, TokenType.MFA)
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
    });
    return result;
  }
}
