import { Entity } from '../models/entity';

export class EntityViewModel {
  static toHttp(entity: Entity) {
    return {
      id: entity._id,
      document: entity.document ? entity.document : null,
      email: entity.email ? entity.email : null,
      phone: entity.phone ? entity.phone : null,
      photo: entity.photo ? entity.photo : null,
      status: entity.status,
      type: entity.type,
    };
  }
}
