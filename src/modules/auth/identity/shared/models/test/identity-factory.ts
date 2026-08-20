import { randomBytes, randomUUID } from 'crypto';
import { Identity, Identity_Props } from '../identity';
import {
  AuthProvider,
  EntityStatus,
  IdentityStatus,
} from '@modules/utils/enum';
import { Entity } from '@modules/auth/entity/shared/models/entity';

type Override = Partial<Identity_Props>;
type FactoryParams = {
  id?: string;
  props?: Override;
};

export function makeIdentity({ id, props }: FactoryParams = {}) {
  return new Identity(
    {
      mfa_required: false,
      email: '',
      status: IdentityStatus.ATIVO,
      ...props,
    },
    id, // ← agora você consegue passar o id
  );
}
