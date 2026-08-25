import { randomUUID } from 'crypto';
import { Address, Address_Props } from '../address';

type FactoryParams = {
  id?: string;
  props?: Override;
};
type Override = Partial<Address_Props>;
export function makeAddress({ id, props }: FactoryParams = {}) {
  return new Address(
    {
      entity_id: randomUUID(),
      city: 'São Paulo',
      neighborhood: 'dfds',
      number: '21',
      state: 'Sergipe',
      street: 'Rua Ovieido',
      country: 'US',
      zip_code: '4405980',
      latitude: 324325,
      longitude: 543545,
      ...props,
    },
    id,
  );
}
