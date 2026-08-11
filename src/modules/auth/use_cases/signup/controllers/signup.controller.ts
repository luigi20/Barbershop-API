import { Body, Controller, Post } from '@nestjs/common';
import { SignUpService } from '../service/signup.service';
import { SignUpDTO } from '../dto/signupDTO';

@Controller('auth')
export class SignUpController {
  constructor(private readonly signUpService: SignUpService) {}

  @Post('signup')
  public async SignUp(@Body() data: SignUpDTO) {
    return await this.signUpService.execute({
      email: data.email,
      name: data.name,
      password: data.password,
      entity_name: data.entity_name,
      birth_date: data.birth_date,
      phone: data.phone,
      photo: data.photo,
      entity_type: data.entity_type,
    });
  }
}
