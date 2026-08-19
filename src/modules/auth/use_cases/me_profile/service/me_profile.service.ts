import { IEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';

interface IMeProfileRequest {
  profile_id: string;
  entity_id: string;
}

@Injectable()
export class MeProfileService {
  constructor(
    private readonly profile_repository: IProfileRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly entity_membercustomer_repository: IEntityCustomerRepository,
  ) {}

  public async execute({
    profile_id,
    entity_id,
  }: IMeProfileRequest): Promise<Profile> {
    const profile_exists =
      await this.profile_repository.find_identity_id(profile_id);
    if (!profile_exists) throw new AppError('Perfil não existe', 404);
    const membership = await this.entity_membership_repository.find_one(
      entity_id,
      profile_exists.id,
    );
    const customer = await this.entity_membercustomer_repository.find_one(
      entity_id,
      profile_exists.id,
    );
    const isMember = membership && membership.status.toLowerCase() === 'ativo';
    const isCustomer = customer && customer.status.toLowerCase() === 'ativo';
    if (!isMember && !isCustomer)
      throw new AppError('Usuário não pertence a esta organização', 403);
    profile_exists.roles =
      membership?.roles?.length > 0 ? [...membership.roles] : [];
    if (isCustomer) profile_exists.roles.push('cliente');
    return profile_exists;
  }
}
