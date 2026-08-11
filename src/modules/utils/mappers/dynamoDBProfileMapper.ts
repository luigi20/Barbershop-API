import { Profile } from '@modules/auth/profile/shared/models/profile';

export class DynamoDBProfileMapper {
  static toDynamo(profile: Profile) {
    return {
      id: profile.id,
      context_id: profile.context_id,
      entity_id: profile.entity_id,
      tenant_id: profile.tenant_id,
      name: profile.name,
      photo_url: profile.photo_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  static toDomain(raw: Profile): Profile {
    return new Profile(
      {
        context_id: raw.context_id,
        entity_id: raw.entity_id,
        name: raw.name,
        tenant_id: raw.tenant_id,
        photo_url: raw.photo_url,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
