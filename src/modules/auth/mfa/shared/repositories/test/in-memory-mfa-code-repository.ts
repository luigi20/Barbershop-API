import { Injectable } from '@nestjs/common';
import { MFA_Code } from '../../models/mfa_code';
import { IMFACodeRepository } from '../abstract_class/imfa-code-repository';

@Injectable()
export class InMemoryMFACodeRepository implements IMFACodeRepository {
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
