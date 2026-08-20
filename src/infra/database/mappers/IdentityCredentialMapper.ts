import { Identity_Credential } from '@modules/auth/identity_credential/shared/models/identity_credential';
import { IdentityCredential as PrismaIdentityCredential } from '@prisma/client';
export class IdentityCredentialMapper {
  static toPrisma(identity_credential: Identity_Credential) {
    return {
      id: identity_credential.id,
      identity_id: identity_credential.identity_id,
      password_hash: identity_credential.password_hash,
      provider_id: identity_credential.provider_id,
      provider: identity_credential.provider,
      created_at: identity_credential.created_at,
      updated_at: identity_credential.updated_at,
    };
  }

  static toDomain(raw: PrismaIdentityCredential): Identity_Credential {
    return new Identity_Credential(
      {
        identity_id: raw.identity_id,
        password_hash: raw.password_hash,
        provider_id: raw.provider_id,
        provider: raw.provider,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
