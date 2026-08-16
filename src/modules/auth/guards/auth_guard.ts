import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { TOKEN_TYPE_KEY } from '../decorators/token-type.decorator';
import { AppError } from '@modules/utils/app_error';
interface IMFATokenPayload {
  sub: string;
  profile_id: string;
  entity_id: string;
  code: string;
  type: string;
  mfa_pending: boolean;
  iss: string;
  name: string;
  photo: string;
  roles: MemberRole[];
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new AppError('Internal Server Error', 500);
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') throw new AppError('Internal Server Error', 500);
    if (!token) throw new AppError('Internal Server Error', 500);
    try {
      const payload = this.jwtService.verify<IMFATokenPayload>(token);
      const requiredTokenTypes = this.reflector.get<TokenType[]>(
        TOKEN_TYPE_KEY,
        context.getHandler(),
      );
      if (
        requiredTokenTypes &&
        !requiredTokenTypes.includes(payload.type as TokenType)
      ) {
        throw new UnauthorizedException(
          'Tipo de token inválido para esta rota',
        );
      }
      request.auth = {
        identity_id: payload.sub,
        entity_id: payload.entity_id,
        profile_id: payload.profile_id,
        name: payload?.name,
        photo: payload?.photo,
        roles: payload?.roles,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
