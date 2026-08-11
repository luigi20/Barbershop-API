import { randomUUID } from 'crypto';
import { Profile, Profile_Props } from '../profile';

type Override = Partial<Profile_Props>;
type FactoryParams = {
  id?: string;
  props?: Override;
};
export function makeProfile({ id, props }: FactoryParams = {}) {
  return new Profile(
    {
      name: 'Luis',
      birth_date: new Date(),
      identity_id: randomUUID(),
      phone: '5579988297613',
      ...props,
    },
    id,
  );
}
