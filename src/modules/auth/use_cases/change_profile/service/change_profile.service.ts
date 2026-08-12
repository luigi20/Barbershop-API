import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';

interface IChangeProfileRequest {
  name: string;
  photo_url: string;
  profile_id: string;
  birth_date: string;
  phone: string;
}

@Injectable()
export class ChangeProfileService {
  constructor(private readonly profile_repository: IProfileRepository) {}

  public async execute({
    name,
    photo_url,
    profile_id,
    birth_date,
    phone,
  }: IChangeProfileRequest): Promise<Profile> {
    const profile_exists = await this.profile_repository.find_one(profile_id);
    if (!profile_exists) throw new AppError('Perfil não existe', 404);
    const profile = new Profile(
      {
        birth_date: new Date(birth_date),
        identity_id: profile_exists.identity_id,
        phone: phone,
        name: name,
        photo: photo_url,
      },
      profile_exists.id,
    );
    await this.profile_repository.update(profile);
    return profile;
  }
}
