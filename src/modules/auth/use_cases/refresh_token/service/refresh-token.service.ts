import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwt_service: JwtService,
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
  ) {}

  async execute(refresh_token: string): Promise<{ access_token: string }> {
    const payload = await this.jwt_service.verifyAsync(refresh_token);
    if (payload?.type !== 'refresh') throw new AppError('Token inválido');
    const identity = await this.identity_repository.findByEntityIdAndContextId(
      payload.sub,
      payload.context_id,
    );
    if (!identity) throw new AppError('Credenciais inválidas');
    const profile = await this.profile_repository.find_one(
      identity.entity_id,
      payload.context_id,
    );
    if (!profile) throw new AppError('Perfil não encontrado para este tenant');
    const access_token = this.jwt_service.sign(
      {
        sub: payload.sub,
        context_id: payload.context_id,
        role: identity.role,
        tenant_id: profile.tenant_id,
        type: 'access',
        iss: 'saas-auth',
      },
      {
        algorithm: 'RS256',
        //  expiresIn: '15m',
        expiresIn: '1d',
        keyid: 'v1',
      },
    );
    return { access_token };
  }
}
