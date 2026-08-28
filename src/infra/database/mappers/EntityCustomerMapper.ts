import { Entity_Customer } from '@modules/business/entity_customer/shared/models/entity_customer';
import { Prisma, EntityCustomer as PrismaEntityCustomer } from '@prisma/client';

type PrismaEntityCustomerWithEntityName = Prisma.EntityCustomerGetPayload<{
  include: {
    entity: {
      select: {
        name: true;
      };
    };
  };
}>;
export class EntityCustomerMapper {
  static toPrisma(entity_customer: Entity_Customer) {
    return {
      entity_id: entity_customer.entity_id,
      customer_id: entity_customer.customer_id,
      notes: entity_customer.notes ? entity_customer.notes : null,
      status: entity_customer.status,
      created_at: entity_customer.created_at,
      updated_at: entity_customer.updated_at,
    };
  }

  static toDomain(raw: PrismaEntityCustomer): Entity_Customer {
    return new Entity_Customer({
      entity_id: raw.entity_id,
      customer_id: raw.customer_id,
      notes: raw.notes ? raw.notes : null,
      status: raw.status,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  }

  static toDomainCustomerWithName(
    raw: PrismaEntityCustomerWithEntityName,
  ): Entity_Customer {
    return new Entity_Customer({
      entity_id: raw.entity_id,
      customer_id: raw.customer_id,
      entity_name: raw?.entity?.name ? raw.entity.name : null,
      notes: raw.notes ? raw.notes : null,
      status: raw.status,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  }
}
