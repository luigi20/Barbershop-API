import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';

interface IMembersRequest {
  tenant_id: string;
  context_id: string;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly profile_repository: IProfileRepository,
    private readonly identity_repository: IIdentityRepository,
  ) {}

  public async execute({
    context_id,
    tenant_id,
  }: IMembersRequest): Promise<Profile[]> {
    const members = await this.profile_repository.find(context_id, tenant_id);
    if (!members || members.length === 0) return [];
    await Promise.all(
      members.map(async (member) => {
        const identity =
          await this.identity_repository.findByEntityIdAndContextId(
            member.entity_id,
            context_id,
          );
        if (identity) {
          member.role = identity.role;
        }
      }),
    );
    return members;
  }
}
