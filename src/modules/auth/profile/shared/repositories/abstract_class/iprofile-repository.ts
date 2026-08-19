import { Prisma } from '@prisma/client';
import { Profile } from '../../models/profile';
import { IdAndName } from '@modules/utils/types/types';

abstract class IProfileRepository {
  abstract create(data: Profile, tx?: Prisma.TransactionClient): Promise<void>;
  abstract update(data: Profile): Promise<void>;
  abstract find_identity_id(identity_id: string): Promise<Profile | null>;
  abstract find_one(id: string): Promise<Profile | null>;
  abstract findByIdSelectIdAndName(id: string): Promise<IdAndName | null>;
}
export { IProfileRepository };
