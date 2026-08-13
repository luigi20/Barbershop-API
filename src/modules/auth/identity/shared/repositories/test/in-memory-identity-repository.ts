import { Injectable } from '@nestjs/common';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';

@Injectable()
class InMemoryIdentityRepository implements IIdentityRepository {
  async update_last_login_at(
    identity_id: string,
    last_login_at: Date,
  ): Promise<void> {
    const index = this.list_identity.findIndex(
      (item) => item.id === identity_id,
    );
    if (index >= 0) {
      this.list_identity[index].last_login_at = last_login_at;
    }
  }
  async find_by_email(email: string): Promise<Identity | null> {
    const identity = this.list_identity.find((item) => item.email === email);
    if (!identity) return null;
    return identity;
  }

  async find_by_id(id: string): Promise<Identity | null> {
    const identity = this.list_identity.find((item) => item.id === id);
    if (!identity) return null;
    return identity;
  }
  async update_password(entity_id: string, new_hash: string): Promise<void> {
    const index = this.list_identity.findIndex((item) => item.id === entity_id);
    if (index >= 0) {
      this.list_identity[index].password_hash = new_hash;
    }
  }
  async set_update_mfa_required(
    identity_id: string,
    mfa_required: boolean,
  ): Promise<void> {
    const index = this.list_identity.findIndex(
      (item) => item.id === identity_id,
    );
    if (index >= 0) {
      this.list_identity[index].mfa_required = mfa_required;
    }
  }
  public list_identity: Identity[] = [];

  async create(data: Identity): Promise<void> {
    this.list_identity.push(data);
  }
}
export { InMemoryIdentityRepository };
