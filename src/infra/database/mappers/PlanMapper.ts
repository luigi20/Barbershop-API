import { Plan } from '@modules/business/plan/shared/models/plan';
import { Plan as PrismaPlan } from '@prisma/client';

export class PlanMapper {
  static toPrisma(plan: Plan) {
    return {
      id: plan._id,
      name: plan.name,
      price: plan.price,
      description: plan.description ? plan.description : null,
      max_members: plan.max_members ? plan.max_members : null,
      max_customers: plan.max_customers ? plan.max_customers : null,
      max_appointments: plan.max_appointments ? plan.max_appointments : null,
      active: plan.active,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    };
  }

  static toDomain(raw: PrismaPlan): Plan {
    return new Plan({
      name: raw.name,
      price: raw.price.toNumber(),
      description: raw.description ? raw.description : null,
      max_members: raw.max_members ? raw.max_members : null,
      max_customers: raw.max_customers ? raw.max_customers : null,
      max_appointments: raw.max_appointments ? raw.max_appointments : null,
      active: raw.active,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  }
}
