import { Entity } from '@modules/auth/entity/shared/models/entity';
import { Entity as PrismaEntity } from '@prisma/client';
export class EntityMapper {
  static toPrisma(entity: Entity) {
    return {
      id: entity._id,
      email: entity.email ? entity.email : null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      type: entity.type,
      name: entity.name,
      document: entity.document ? entity.document : null,
      phone: entity.phone ? entity.phone : null,
      photo: entity.photo ? entity.photo : null,
      status: entity.status,
    };
  }

  static toDomain(raw: PrismaEntity): Entity {
    return new Entity(
      {
        email: raw.email,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        type: raw.type,
        name: raw.name,
        document: raw.document,
        phone: raw.phone,
        photo: raw.photo,
        status: raw.status,
      },
      raw.id,
    );
  }
  /*
  static EntityDomainType(type: string): EntityType {
    switch (type) {
      case 'BARBEARIA':
        return EntityType.BARBEARIA;
      case 'STUDIO':
        return EntityType.STUDIO;

      default:
        throw new Error(`Tipo inválido: ${type}`);
    }
  }

  private static EntityStatusDomainType(type: string): EntityStatus {
    switch (type) {
      case 'ATIVO':
        return EntityStatus.ATIVO;
      case 'BLOQUEADO':
        return EntityStatus.BLOQUEADO;
      case 'INATIVO':
        return EntityStatus.INATIVO;
      default:
        throw new AppError(`Tipo inválido: ${type}`);
    }
  }*/
}
