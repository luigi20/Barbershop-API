import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JWKSService } from '../service/jwks.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('auth')
export class JWKSController {
  constructor(private readonly JWKS_Service: JWKSService) {}

  @Post('jwks')
  public async JWKS() {
    const result = await this.JWKS_Service.execute();
    return result;
  }
}
