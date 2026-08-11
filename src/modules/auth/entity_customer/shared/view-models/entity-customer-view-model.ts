import { Entity_Customer } from '../models/entity_customer';

export class Entity_Customer_View_Model {
  static toHttp(entity_customer: Entity_Customer) {
    return {
      entity_id: entity_customer.entity_id,
      profile_id: entity_customer.profile_id,
      notes: entity_customer.notes,
      status: entity_customer.status,
      created_at: entity_customer.created_at,
      updated_at: entity_customer.updated_at,
    };
  }
}
