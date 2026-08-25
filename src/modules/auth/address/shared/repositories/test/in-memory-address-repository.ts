import { Injectable } from '@nestjs/common';
import { IAddressRepository } from '../abstract_class/iaddress-repository';
import { Address } from '../../models/address';

@Injectable()
class InMemoryAddressRepository implements IAddressRepository {
  async findByEntityId(entity_id: string): Promise<Address | null> {
    const address = this.list_address.find(
      (item) => item.entity_id === entity_id,
    );
    if (!address) return null;
    return address;
  }

  async findByListEntityId(list_entity_id: string[]): Promise<Address[]> {
    const list_address = this.list_address.filter((item) =>
      list_entity_id.includes(item.entity_id),
    );

    return list_address;
  }
  async update(data: Address): Promise<void> {
    const index = this.list_address.findIndex((item) => item._id === data._id);
    if (index >= 0) {
      this.list_address[index] = data;
    }
  }

  public list_address: Address[] = [];

  async create(data: Address): Promise<void> {
    this.list_address.push(data);
  }

  async findById(id: string): Promise<Address | null> {
    const address = this.list_address.find((item) => item._id === id);
    if (!address) return null;
    return address;
  }
}
export { InMemoryAddressRepository };
