import { Injectable } from '@nestjs/common';
import { ICustomerRepository } from '../abstract_class/icustomer-repository';
import { Customer } from '../../models/customer';

@Injectable()
export class InMemoryCustomerRepository implements ICustomerRepository {
  async find_all(): Promise<Customer[]> {
    return this.list_customer;
  }
  async find_profile_id(profile_id: string): Promise<Customer> {
    const customer = this.list_customer.find(
      (item) => item.profile_id === profile_id,
    );
    return customer;
  }
  async find_one(id: string): Promise<Customer | null> {
    const customer = this.list_customer.find((item) => item._id === id);
    if (!customer) return null;
    return customer;
  }
  async update(data: Customer): Promise<void> {
    const index = this.list_customer.findIndex(
      (item) => item._id === data._id && item.profile_id === data.profile_id,
    );
    if (index >= 0) {
      this.list_customer[index] = data;
    }
  }
  public list_customer: Customer[] = [];

  async create(data: Customer): Promise<void> {
    this.list_customer.push(data);
  }
}
