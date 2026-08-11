import { Body, Controller, Post } from '@nestjs/common';
import { RefreshTokenDTO } from '../dto/refresh-tokenDTO';
import { RefreshTokenService } from '../service/refresh-token.service';

@Controller('auth')
export class RefreshTokenController {
  constructor(private readonly refresh_token_service: RefreshTokenService) {}

  @Post('refreshtoken')
  public async RefreshToken(@Body() data: RefreshTokenDTO) {
    const token = await this.refresh_token_service.execute(data.refresh_token);
    return token;
  }
}
