import { Injectable } from '@nestjs/common';
import { IIdentityCredentialRepository } from '../abstract_class/iidentitycredential-repository';
import { Identity_Credential } from '../../models/identity_credential';

@Injectable()
class InMemoryIdentityCredentialRepository implements IIdentityCredentialRepository {
  async find_by_identity_id(
    identity_id: string,
  ): Promise<Identity_Credential[]> {
    const identity_credential = this.list_identity_credential.filter(
      (item) => item.identity_id === identity_id,
    );
    if (!identity_credential) return null;
    return identity_credential;
  }
  async find_by_provider(
    provider: string,
    identity_id: string,
  ): Promise<Identity_Credential | null> {
    const identity_credential = this.list_identity_credential.find(
      (item) => item.provider === provider && item.identity_id === identity_id,
    );
    if (!identity_credential) return null;
    return identity_credential;
  }
  async update(data: Identity_Credential): Promise<void> {
    const index = this.list_identity_credential.findIndex(
      (item) => item.id === data.id,
    );
    if (index >= 0) {
      this.list_identity_credential[index] = data;
    }
  }

  async find_by_id(id: string): Promise<Identity_Credential | null> {
    const identity_credential = this.list_identity_credential.find(
      (item) => item.id === id,
    );
    if (!identity_credential) return null;
    return identity_credential;
  }
  async update_password(identity_id: string, new_hash: string): Promise<void> {
    const index = this.list_identity_credential.findIndex(
      (item) => item.id === identity_id,
    );
    if (index >= 0) {
      this.list_identity_credential[index].password_hash = new_hash;
    }
  }
  async set_update_mfa_required(
    identity_id: string,
    mfa_required: boolean,
  ): Promise<void> {
    const index = this.list_identity_credential.findIndex(
      (item) => item.id === identity_id,
    );
    if (index >= 0) {
      this.list_identity_credential[index].identity_id = String(mfa_required);
    }
  }
  public list_identity_credential: Identity_Credential[] = [];

  async create(data: Identity_Credential): Promise<void> {
    this.list_identity_credential.push(data);
  }
}
export { InMemoryIdentityCredentialRepository };
