import { Identity_Credential } from '../models/identity_credential';

export class IdentityCredentialViewModel {
  static toHttp(identity_credential: Identity_Credential) {
    return {
      id: identity_credential.id,
      provider: identity_credential.provider,
      created_at: identity_credential.created_at
        ? identity_credential.created_at
        : null,
      updated_at: identity_credential.updated_at
        ? identity_credential.updated_at
        : null,
    };
  }
}
