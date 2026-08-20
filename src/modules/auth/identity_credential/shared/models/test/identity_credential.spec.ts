import { randomUUID } from 'crypto';
import { Identity_Credential } from '../identity_credential';

describe('Create Identity Credential', () => {
  it('should be able to create a Identity Credential', () => {
    const identity_credential = new Identity_Credential({
      identity_id: randomUUID(),
      provider: 'local',
    });
    expect(identity_credential).toBeTruthy();
  });
});
