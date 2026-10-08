import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LogoutService {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokensRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(refresh_token: string, identity_id: string): Promise<void> {
    let payload: { type: string; sub: string; sid: string };
    try {
      payload = this.jwt.verify(refresh_token, { ignoreExpiration: true });
    } catch {
      throw new AppError('Token invalido', 401);
    }
    if (
      payload.type !== 'refresh' ||
      !payload.sid ||
      !identity_id ||
      payload.sub !== identity_id
    ) {
      throw new AppError('Sessao nao pertence ao usuario autenticado', 403);
    }
    // Revokes the session even when the supplied token was already rotated.
    if (
      !(await this.refreshTokenRepository.revoke_session(
        payload.sid,
        identity_id,
      ))
    ) {
      throw new AppError('Sessao nao encontrada', 401);
    }
  }
}
