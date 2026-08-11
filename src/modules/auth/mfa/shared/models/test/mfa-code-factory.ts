import { randomUUID } from 'crypto';
import { MFA_Code, MFA_Code_Props } from '../mfa_code';

type Override = Partial<MFA_Code_Props>;
type FactoryParams = {
  id?: string;
  props?: Override;
};
export function makeMFACode({ id, props }: FactoryParams = {}) {
  return new MFA_Code(
    {
      identity_id: randomUUID(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      code_hash: '4234tuv',
      used_at: false,
      attempts: 0,
      type: 'email',
      ...props,
    },
    id,
  );
}
