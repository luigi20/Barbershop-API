import { randomBytes, randomUUID } from 'crypto';
import { Identity } from '../identity';
import { AuthProvider, IdentityStatus } from '@modules/utils/enum';

describe('Create Identity', () => {
  it('should be able to create a Identity', () => {
    const identity = new Identity({
      mfa_required: false,
      email: '',
      status: IdentityStatus.ATIVO,
    });
    expect(identity).toBeTruthy();
  });
});
