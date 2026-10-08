import { Entity_Customer } from '../models/entity_customer';

export class Entity_Customer_View_Model {
  static toHttp(entity_customer: Entity_Customer) {
    return {
      entity_id: entity_customer.entity_id,
      customer_id: entity_customer.customer_id,
      profile_id: entity_customer.profile_id ?? null,
      email: entity_customer.email ?? null,
      entity_name: entity_customer.entity_name,
      profile_name: entity_customer.profile_name,
      phone: entity_customer.phone,
      photo: entity_customer.photo,
      birth_date: entity_customer.birth_date,
      notes: entity_customer.notes,
      status: entity_customer.status,
      created_at: entity_customer.created_at,
      updated_at: entity_customer.updated_at,
    };
  }
}
