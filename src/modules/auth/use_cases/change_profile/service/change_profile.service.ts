import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { Optional } from '@nestjs/common';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';

interface IChangeProfileRequest {
  name?: string;
  photo_url?: string | null;
  profile_id: string;
  birth_date?: string | null;
  phone?: string | null;
}

@Injectable()
export class ChangeProfileService {
  constructor(
    private readonly profile_repository: IProfileRepository,
    @Optional() private readonly identity_repository?: IIdentityRepository,
  ) {}

  public async execute({
    name,
    photo_url,
    profile_id,
    birth_date,
    phone,
  }: IChangeProfileRequest): Promise<Profile> {
    const profile_exists = await this.profile_repository.find_one(profile_id);
    if (!profile_exists) throw new AppError('Perfil não existe', 404);
    if (
      name === undefined &&
      photo_url === undefined &&
      birth_date === undefined &&
      phone === undefined
    )
      throw new AppError('Nenhum campo para atualizar', 400);
    if (name === null || (name !== undefined && !name.trim()))
      throw new AppError('Nome inválido', 400);
    if (
      birth_date !== undefined &&
      birth_date !== null &&
      Number.isNaN(Date.parse(birth_date))
    )
      throw new AppError('Data de nascimento inválida', 400);
    const profile = new Profile(
      {
        birth_date:
          birth_date === undefined
            ? profile_exists.birth_date
            : birth_date === null
              ? null
              : new Date(birth_date),
        identity_id: profile_exists.identity_id,
        created_at: profile_exists.created_at,
        phone: phone === undefined ? profile_exists.phone : phone,
        name: name === undefined ? profile_exists.name : name,
        photo: photo_url === undefined ? profile_exists.photo : photo_url,
      },
      profile_exists.id,
    );
    await this.profile_repository.update(profile);
    const updated = await this.profile_repository.find_one(profile_id);
    if (!updated) throw new AppError('Perfil não existe', 404);
    if (this.identity_repository)
      updated.identity = await this.identity_repository.find_by_id(
        updated.identity_id,
      );
    return updated;
  }
}
