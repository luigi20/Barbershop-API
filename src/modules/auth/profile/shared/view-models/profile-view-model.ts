import { Profile } from '../models/profile';

export class Profile_View_Model {
  static toHttp(profile: Profile) {
    return {
      id: profile.id,
      identity_id: profile.identity_id,
      name: profile.name,
      photo: profile.photo,
      phone: profile.phone,
      roles: profile.roles,
      birth_date: profile.birth_date,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}
