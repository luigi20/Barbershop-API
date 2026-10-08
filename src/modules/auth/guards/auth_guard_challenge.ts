import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { bearerToken } from '../security/request-security';

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
  is_superuser?: boolean;
}

@Injectable()
export class AuthGuardChallenge implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = bearerToken(request);
    try {
      const payload = this.jwtService.verify<IMFATokenPayload>(token);
      if (payload.type !== TokenType.CHALLENGE) {
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
        is_superuser: payload.is_superuser === true,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
