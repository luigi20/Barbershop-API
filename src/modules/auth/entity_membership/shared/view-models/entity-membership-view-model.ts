import { EntityMembership } from '@prisma/client';

export class Entity_Membership_View_Model {
  static toHttp(entity_membership: EntityMembership) {
    return {
      entity_id: entity_membership.entity_id,
      profile_id: entity_membership.profile_id,
      role: entity_membership.role,
      status: entity_membership.status,
      created_at: entity_membership.created_at,
      updated_at: entity_membership.updated_at,
    };
  }
}
