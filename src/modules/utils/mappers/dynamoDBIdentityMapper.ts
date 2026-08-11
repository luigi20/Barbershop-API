import { Identity } from '@modules/auth/identity/shared/models/identity';

export class DynamoDBIdentityMapper {
  static toDynamo(identity: Identity) {
    return {
      id: identity.id,
      entity_id: identity.entity_id,
      context_id: identity.context_id,
      is_active: identity.is_active,
      mfa_required: identity.mfa_required,
      password: identity.password,
      role: identity.role,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    };
  }

  static toDomain(raw: Identity): Identity {
    return new Identity(
      {
        entity_id: raw.entity_id,
        context_id: raw.context_id,
        is_active: raw.is_active,
        mfa_required: raw.mfa_required,
        password: raw.password,
        role: raw.role,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
