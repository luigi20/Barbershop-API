import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthSocialLoginService } from '../services/auth_social_login.service';
import { Social_LoginDTO } from '../dto/social_loginDTO';

@ApiTags('Auth')
@Controller('auth')
export class AuthSocialLoginController {
  constructor(
    private readonly authSocialLoginService: AuthSocialLoginService,
  ) {}

  @Post('social_login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login social',
    description:
      'Autentica o usuário utilizando um token fornecido por um provedor de login social.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login social realizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Provedor ou token inválido.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não foi possível autenticar o usuário.',
  })
  async google_login(@Body() data: Social_LoginDTO) {
    return this.authSocialLoginService.execute({
      provider: data.provider,
      token: data.token,
    });
  }
}
