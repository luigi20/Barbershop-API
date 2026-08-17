import { Prisma } from '@prisma/client';
import { Plan } from '../../models/plan';

abstract class IPlanRepository {
  abstract create(data: Plan, tx?: Prisma.TransactionClient): Promise<void>;
  abstract update(data: Plan): Promise<void>;
  abstract list(): Promise<Plan[]>;
  abstract find_one(id: string): Promise<Plan | null>;

  abstract find_one_name(name: string): Promise<Plan | null>;
}
export { IPlanRepository };
