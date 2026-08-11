import { Profile } from '@modules/auth/profile/shared/models/profile';
import { Profile as PrismaProfile } from '@prisma/client';
export class ProfileMapper {
  static toPrisma(profile: Profile) {
    return {
      id: profile.id,
      identity_id: profile.identity_id,
      birth_date: profile.birth_date,
      photo: profile.photo,
      name: profile.name,
      phone: profile.phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  static toDomain(raw: PrismaProfile): Profile {
    return new Profile(
      {
        identity_id: raw.identity_id,
        birth_date: raw.birth_date,
        photo: raw.photo,
        name: raw.name,
        phone: raw.phone,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
