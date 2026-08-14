import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RefreshTokenDTO } from '../dto/refresh-tokenDTO';
import { RefreshTokenService } from '../service/refresh-token.service';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.REFRESH)
@Controller('auth')
export class RefreshTokenController {
  constructor(private readonly refresh_token_service: RefreshTokenService) {}

  @Post('refreshtoken')
  public async RefreshToken(@Body() data: RefreshTokenDTO) {
    const token = await this.refresh_token_service.execute(data.refresh_token);
    return token;
  }
}
