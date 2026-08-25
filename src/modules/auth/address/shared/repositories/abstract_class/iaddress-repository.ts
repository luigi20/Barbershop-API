import { Prisma } from '@prisma/client';
import { Address } from '../../models/address';

abstract class IAddressRepository {
  abstract create(data: Address, tx?: Prisma.TransactionClient): Promise<void>;
  abstract findByEntityId(entity_id: string): Promise<Address | null>;
  abstract findByListEntityId(list_entity_id: string[]): Promise<Address[]>;
  abstract findById(id: string): Promise<Address | null>;
  abstract update(data: Address, tx?: Prisma.TransactionClient): Promise<void>;
}
export { IAddressRepository };
