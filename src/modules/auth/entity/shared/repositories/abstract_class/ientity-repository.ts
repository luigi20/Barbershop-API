import { Entity } from '@modules/auth/entity/shared/models/entity';

abstract class IEntityRepository {
  abstract create(data: Entity): Promise<void>;
  abstract findByEmail(email: string): Promise<Entity | null>;
  abstract findById(id: string): Promise<Entity | null>;
  abstract findByIdAndEmail(
    entity_id: string,
    email: string,
  ): Promise<Entity | null>;
  abstract findByDocument(document: string): Promise<Entity | null>;
}
export { IEntityRepository };
