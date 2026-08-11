import { Identity } from '@modules/auth/identity/shared/models/identity';
import { Prisma } from '@prisma/client';

abstract class IIdentityRepository {
  abstract create(data: Identity, tx?: Prisma.TransactionClient): Promise<void>;
  abstract update_password(entity_id: string, new_hash: string): Promise<void>;

  abstract update_last_login_at(
    identity_id: string,
    last_login_at: Date,
  ): Promise<void>;
  abstract find_by_email(email: string): Promise<Identity | null>;
  abstract set_update_mfa_required(
    entity_id: string,
    mfa_required: boolean,
  ): Promise<void>;
}
export { IIdentityRepository };
