import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GenerateMFAService } from '../services/generate-mfa-service';
import { GenerateMFADTO } from '../dto/generate-mfa-DTO';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';
import { AuthGuardMFA } from '@modules/auth/guards/auth_guard_mfa';

@ApiTags('MFA')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuardMFA)
@TokenTypeRequired(TokenType.MFA)
@Controller('auth')
export class GenerateMFAController {
  constructor(private readonly generate_MFA_service: GenerateMFAService) {}

  @Post('generatemfa')
  @ApiOperation({
    summary: 'Gerar código MFA',
    description:
      'Gera um código MFA e envia o código para o e-mail da identidade.',
  })
  @ApiResponse({
    status: 201,
    description: 'Código MFA gerado e enviado com sucesso.',
    schema: {
      example: 'Email enviado com Sucesso',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados da requisição inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, expirado ou tipo de token não permitido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Identidade não encontrada.',
  })
  public async GenerateMFA(@Body() data: GenerateMFADTO) {
    const result = await this.generate_MFA_service.execute({
      email: data.email,
      type: data.type,
    });

    return result;
  }
}
