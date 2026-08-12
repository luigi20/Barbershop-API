import { Prisma } from '@prisma/client';
import { Profile } from '../../models/profile';

abstract class IProfileRepository {
  abstract create(data: Profile, tx?: Prisma.TransactionClient): Promise<void>;
  abstract update(data: Profile): Promise<void>;
  abstract find_identity_id(identity_id: string): Promise<Profile | null>;
  abstract find_one(id: string): Promise<Profile | null>;
}
export { IProfileRepository };
