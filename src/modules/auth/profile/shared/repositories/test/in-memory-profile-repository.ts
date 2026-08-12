import { Injectable } from '@nestjs/common';
import { Profile } from '../../models/profile';
import { IProfileRepository } from '../abstract_class/iprofile-repository';

@Injectable()
export class InMemoryProfileRepository implements IProfileRepository {
  async find_identity_id(identity_id: string): Promise<Profile | null> {
    const index = this.list_profile.find(
      (item) => item.identity_id === identity_id,
    );
    if (!index) return null;
    return index;
  }

  async find_one(id: string): Promise<Profile | null> {
    const index = this.list_profile.find((item) => item.id === id);
    if (!index) return null;
    return index;
  }
  async update(data: Profile): Promise<void> {
    const index = this.list_profile.findIndex((item) => item.id === data.id);
    if (index >= 0) {
      this.list_profile[index] = data;
    }
  }
  public list_profile: Profile[] = [];

  async create(data: Profile): Promise<void> {
    this.list_profile.push(data);
  }
}
