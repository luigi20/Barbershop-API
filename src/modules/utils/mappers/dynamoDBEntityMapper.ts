import { Entity } from '@modules/auth/entity/shared/models/entity';

export class DynamoDBEntityMapper {
  static toDynamo(entity: Entity) {
    return {
      id: entity._id,
      email: entity.email,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toDomain(raw: Entity): Entity {
    return new Entity(
      {
        email: raw.email,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw._id,
    );
  }
}
