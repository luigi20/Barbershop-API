import { Identity } from '@modules/auth/identity/shared/models/identity';
import { Identity as PrismaIdentity } from '@prisma/client';
export class IdentityMapper {
  static toPrisma(identity: Identity) {
    return {
      id: identity.id,
      email: identity.email,
      mfa_required: identity.mfa_required,
      last_login_at: identity.last_login_at,
      is_superuser: identity.is_superuser,
      status: identity.status,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    };
  }

  static toDomain(raw: PrismaIdentity): Identity {
    return new Identity(
      {
        email: raw.email,
        mfa_required: raw.mfa_required,
        status: raw.status,
        last_login_at: raw.last_login_at,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        is_superuser: raw.is_superuser,
      },
      raw.id,
    );
  }
}
