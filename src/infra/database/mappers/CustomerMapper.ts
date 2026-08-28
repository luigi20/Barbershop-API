import { Customer } from '@modules/business/customer/shared/models/customer';
import { Customer as PrismaCustomer } from '@prisma/client';

export class CustomerMapper {
  static toPrisma(customer: Customer) {
    return {
      profile_id: customer.profile_id,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    };
  }

  static toDomain(raw: PrismaCustomer): Customer {
    return new Customer({
      profile_id: raw.profile_id,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  }
}
