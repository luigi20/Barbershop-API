import { Entity_Membership } from '@modules/auth/entity_membership/shared/models/entity_membership';
import {
  Prisma,
  EntityMembership as PrismaEntityMembership,
} from '@prisma/client';

type PrismaEntityMembershipWithProfEntityName =
  Prisma.EntityMembershipGetPayload<{
    include: {
      entity: {
        select: {
          name: true;
        };
      };
    };
  }>;

export class EntityMembershipMapper {
  static toPrisma(entity_membership: Entity_Membership) {
    return {
      entity_id: entity_membership.entity_id,
      profile_id: entity_membership.profile_id,
      role: entity_membership.role,
      status: entity_membership.status,
      created_at: entity_membership.created_at,
      updated_at: entity_membership.updated_at,
    };
  }

  static toDomain(raw: PrismaEntityMembership): Entity_Membership {
    return new Entity_Membership({
      entity_id: raw.entity_id,
      profile_id: raw.profile_id,
      role: raw.role,
      status: raw.status,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  }

  static toDomainWithProfEntityName(
    raw: PrismaEntityMembershipWithProfEntityName,
  ): Entity_Membership {
    return new Entity_Membership({
      entity_id: raw.entity_id,
      profile_id: raw.profile_id,
      name: raw?.entity?.name ? raw.entity.name : null,
      role: raw.role,
      status: raw.status,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  }
}
