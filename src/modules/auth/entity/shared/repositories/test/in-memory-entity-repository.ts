import { Injectable } from '@nestjs/common';
import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '../abstract_class/ientity-repository';

@Injectable()
class InMemoryEntityRepository implements IEntityRepository {
  async findByDocument(document: string): Promise<Entity | null> {
    const entity = this.list_entity.find((item) => item.document === document);
    if (!entity) return null;
    return entity;
  }
  public list_entity: Entity[] = [];
  async findByEmail(email: string): Promise<Entity | null> {
    const entity = this.list_entity.find((item) => item.email === email);
    if (!entity) return null;
    return entity;
  }

  async create(data: Entity): Promise<void> {
    this.list_entity.push(data);
  }

  async findById(id: string): Promise<Entity | null> {
    const entity = this.list_entity.find((item) => item._id === id);
    if (!entity) return null;
    return entity;
  }

  async findByIdAndEmail(
    entity_id: string,
    email: string,
  ): Promise<Entity | null> {
    const entity = this.list_entity.find(
      (item) => item._id === entity_id && item.email === email,
    );
    if (!entity) return null;
    return entity;
  }
}
export { InMemoryEntityRepository };
