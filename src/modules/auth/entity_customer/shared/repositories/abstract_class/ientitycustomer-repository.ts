import { Entity_Customer } from '../../models/entity_customer';

abstract class IEntityCustomerRepository {
  abstract create(data: Entity_Customer): Promise<void>;
  abstract update(data: Entity_Customer): Promise<void>;
  abstract find_list_entity_id(entity_id: string): Promise<Entity_Customer[]>;

  abstract find_one(
    entity_id: string,
    profile_id: string,
  ): Promise<Entity_Customer | null>;
}
export { IEntityCustomerRepository };
