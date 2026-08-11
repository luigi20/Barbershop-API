import { randomUUID } from 'crypto';
import { Profile } from '../profile';

describe('Create Profile', () => {
  it('should be able to create a Profile', () => {
    const profile = new Profile({
      name: 'Luis',
      birth_date: new Date(),
      identity_id: randomUUID(),
      phone: '5579988297613',
    });
    expect(profile).toBeTruthy();
  });
});
