import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IdAndName } from '@modules/utils/types/types';
import { Prisma } from '@prisma/client';

abstract class IEntityRepository {
  abstract create(data: Entity, tx?: Prisma.TransactionClient): Promise<void>;
  abstract findByEmail(email: string): Promise<Entity | null>;
  abstract findById(id: string): Promise<Entity | null>;
  abstract findByIdSelectIdAndName(id: string): Promise<IdAndName | null>;
  abstract findByIdAndEmail(
    entity_id: string,
    email: string,
  ): Promise<Entity | null>;
  abstract findByDocument(document: string): Promise<Entity | null>;
}
export { IEntityRepository };
