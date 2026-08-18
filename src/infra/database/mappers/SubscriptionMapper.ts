import { Subscription } from '@modules/business/subscription/shared/models/subscription';
import { Subscription as PrismaSubscription } from '@prisma/client';

export class SubscriptionMapper {
  static toPrisma(subscription: Subscription) {
    return {
      id: subscription._id,
      entity_id: subscription.entity_id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      started_at: subscription.started_at,
      ended_at: subscription.ended_at ? subscription.ended_at : null,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
    };
  }

  static toDomain(raw: PrismaSubscription): Subscription {
    return new Subscription(
      {
        entity_id: raw.entity_id,
        plan_id: raw.plan_id,
        status: raw.status,
        started_at: raw.started_at,
        ended_at: raw.ended_at ? raw.ended_at : null,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
