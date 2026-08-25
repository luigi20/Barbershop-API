import { randomUUID } from 'crypto';
import { Address } from '../address';

describe('Create Address', () => {
  it('should be able to create a Address', () => {
    const address = new Address({
      entity_id: randomUUID(),
      city: 'São Paulo',
      neighborhood: 'dfds',
      number: '21',
      state: 'Sergipe',
      street: 'Rua Ovieido',
      zip_code: '4405980',
      country: 'US',
      latitude: 324325,
      longitude: 543545,
    });
    expect(address).toBeTruthy();
  });
});
