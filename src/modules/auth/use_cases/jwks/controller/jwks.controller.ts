import { Body, Controller, Post } from '@nestjs/common';
import { JWKSService } from '../service/jwks.service';

@Controller('auth')
export class JWKSController {
  constructor(private readonly JWKS_Service: JWKSService) {}

  @Post('jwks')
  public async JWKS() {
    const result = await this.JWKS_Service.execute();
    return result;
  }
}
