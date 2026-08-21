import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignUpService } from '../service/signup.service';
import { SignUpDTO } from '../dto/signupDTO';

@ApiTags('Auth')
@Controller('auth')
export class SignUpController {
  constructor(private readonly signUpService: SignUpService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Criar uma nova conta',
    description: 'Cria uma nova identidade, perfil e entidade para o usuário.',
  })
  @ApiResponse({
    status: 201,
    description: 'Conta criada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados da requisição inválidos.',
  })
  @ApiResponse({
    status: 409,
    description: 'E-mail ou documento já cadastrado.',
  })
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
      document: data.document,
    });
  }
}
