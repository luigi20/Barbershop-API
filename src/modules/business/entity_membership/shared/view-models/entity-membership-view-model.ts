import { Entity_Membership } from '../models/entity_membership';

export class Entity_Membership_View_Model {
  static toHttp(entity_membership: Entity_Membership) {
    return {
      entity_id: entity_membership.entity_id,
      profile_id: entity_membership.profile_id,
      identity_id: entity_membership.identity_id ?? null,
      email: entity_membership.email ?? null,
      entity_name: entity_membership.entity_name,
      profile_name: entity_membership.profile_name,
      phone: entity_membership.phone,
      photo: entity_membership.photo,
      birth_date: entity_membership.birth_date,
      roles: entity_membership.roles,
      status: entity_membership.status,
      created_at: entity_membership.created_at,
      updated_at: entity_membership.updated_at,
    };
  }
}
