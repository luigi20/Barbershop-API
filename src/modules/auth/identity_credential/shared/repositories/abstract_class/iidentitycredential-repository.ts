import { Prisma } from '@prisma/client';
import { Identity_Credential } from '../../models/identity_credential';

abstract class IIdentityCredentialRepository {
  abstract create(
    data: Identity_Credential,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  abstract update_password(entity_id: string, new_hash: string): Promise<void>;
  abstract find_by_id(id: string): Promise<Identity_Credential | null>;
  abstract find_by_provider(
    provider: string,
    identity_id: string,
  ): Promise<Identity_Credential | null>;
  abstract find_by_identity_id(
    identity_id: string,
  ): Promise<Identity_Credential[]>;

  abstract update(
    data: Identity_Credential,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
export { IIdentityCredentialRepository };
