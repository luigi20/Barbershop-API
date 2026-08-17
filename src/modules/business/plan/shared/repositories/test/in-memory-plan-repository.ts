import { Injectable } from '@nestjs/common';
import { IPlanRepository } from '../abstract_class/iplan-repository';
import { Plan } from '../../models/plan';

@Injectable()
class InMemoryPlanRepository implements IPlanRepository {
  async update(data: Plan): Promise<void> {
    const index = this.list_plan.findIndex((item) => item._id === data._id);
    if (index >= 0) {
      this.list_plan[index] = data;
    }
  }
  async list(): Promise<Plan[]> {
    return this.list_plan;
  }
  public list_plan: Plan[] = [];
  async create(data: Plan): Promise<void> {
    this.list_plan.push(data);
  }

  async find_one(id: string): Promise<Plan | null> {
    const plan = this.list_plan.find((item) => item._id === id);
    if (!plan) return null;
    return plan;
  }

  async find_one_name(name: string): Promise<Plan | null> {
    const plan = this.list_plan.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    if (!plan) return null;
    return plan;
  }
}
export { InMemoryPlanRepository };
