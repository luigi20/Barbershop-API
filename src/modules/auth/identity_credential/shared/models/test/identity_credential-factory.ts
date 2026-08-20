import {
  Identity_Credential,
  Identity_Credential_Props,
} from '../identity_credential';
import { randomUUID } from 'crypto';

type Override = Partial<Identity_Credential_Props>;
type FactoryParams = {
  id?: string;
  props?: Override;
};

export function makeIdentityCredential({ id, props }: FactoryParams = {}) {
  return new Identity_Credential(
    {
      identity_id: randomUUID(),
      provider: 'local',
      ...props,
    },
    id, // ← agora você consegue passar o id
  );
}
