import { Body, Controller, Post } from '@nestjs/common';
import { SignInDTO } from '../dto/signinDTO';
import { SignInService } from '../service/signin.service';

@Controller('auth')
export class SignInController {
  constructor(private readonly signInService: SignInService) {}

  @Post('signin')
  public async SignIn(@Body() data: SignInDTO) {
    const result = await this.signInService.execute({
      entity_id: data.entity_id,
      email: data.email,
      password: data.password,
    });
    return result;
  }
}
