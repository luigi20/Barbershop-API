import { Injectable } from '@nestjs/common';
import { MFA_Code } from '../../models/mfa_code';
import { IMFACodeRepository } from '../abstract_class/imfa-code-repository';

@Injectable()
export class InMemoryMFACodeRepository implements IMFACodeRepository {
  async find_one(
    identity_id: string,
    used: boolean,
    now: Date,
  ): Promise<MFA_Code | null> {
    const mfa_code = this.list_MFA_Code.find(
      (item) =>
        item.identity_id === identity_id &&
        item.used_at === used &&
        item.expires_at > now,
    );
    if (!mfa_code) return null;
    return mfa_code;
  }
  public list_MFA_Code: MFA_Code[] = [];

  async create(data: MFA_Code): Promise<void> {
    this.list_MFA_Code.push(data);
  }

  async update_used(id: string): Promise<void> {
    const index = this.list_MFA_Code.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.list_MFA_Code[index].used_at = true;
    }
  }
}
