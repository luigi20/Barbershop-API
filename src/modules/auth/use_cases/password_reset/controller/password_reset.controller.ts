import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PasswordResetDTO } from '../dto/password_resetDTO';

import { PasswordResetService } from '../service/password_reset.service';

import { AuthGuard } from '@modules/auth/guards/auth_guard';

import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';

import { TokenType } from '@modules/utils/enum';

@ApiTags('Auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @UseGuards(AuthGuard)
  @TokenTypeRequired(TokenType.CHALLENGE)
  @Post('passwordreset')
  @ApiOperation({
    summary: 'Redefinir senha',
    description: 'Altera a senha da identidade utilizando o token de desafio.',
  })
  @ApiResponse({
    status: 201,
    description: 'Senha alterada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou senha não atende aos requisitos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de desafio inválido, expirado ou ausente.',
  })
  public async PasswordReset(@Body() data: PasswordResetDTO) {
    const result = await this.passwordResetService.execute({
      email: data.email,
      new_password: data.new_password,
      token: data.token,
    });

    return result;
  }
}
