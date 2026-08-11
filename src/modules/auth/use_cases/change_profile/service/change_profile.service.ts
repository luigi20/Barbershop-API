import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';

interface IChangeProfileRequest {
  name: string;
  photo_url: string;
  context_id: string;
  entity_id: string;
}

@Injectable()
export class ChangeProfileService {
  constructor(
    private readonly profile_repository: IProfileRepository,
    private readonly identity_repository: IIdentityRepository,
  ) {}

  public async execute({
    name,
    photo_url,
    context_id,
    entity_id,
  }: IChangeProfileRequest): Promise<Profile> {
    const identity_exists =
      await this.identity_repository.findByEntityIdAndContextId(
        entity_id,
        context_id,
      );
    if (!identity_exists) throw new AppError('Credenciais inválidas', 404);
    const profile_exists = await this.profile_repository.find_one(
      entity_id,
      context_id,
    );
    if (!profile_exists) throw new AppError('Perfil não existe', 404);
    const profile = new Profile(
      {
        context_id: profile_exists.context_id,
        entity_id: profile_exists.entity_id,
        name: name,
        tenant_id: profile_exists.tenant_id,
        photo_url: photo_url,
      },
      profile_exists.id,
    );
    await this.profile_repository.update(profile);
    profile.role = identity_exists.role;
    return profile;
  }
}
