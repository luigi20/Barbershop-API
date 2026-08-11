import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Entity_Membership } from '@modules/auth/entity_membership/shared/models/entity_membership';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { EntityStatus, IdentityStatus, MemberRole } from '@modules/utils/enum';
import { user_password_validator } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { EntityMapper } from 'infra/database/mappers/EntityMapper';
import { IdentityMapper } from 'infra/database/mappers/IdentityMapper';

interface ISignUpRequest {
  name: string;
  email: string;
  password: string;
  birth_date: Date;
  phone: string;
  photo: string;
  entity_name: string;
  entity_type: string;
}
@Injectable()
export class SignUpService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly membership_repository: IEntityMembershipRepository,
  ) {}

  public async execute({
    name,
    email,
    password,
    entity_name,
    phone,
    photo,
    birth_date,
    entity_type,
  }: ISignUpRequest): Promise<string> {
    const password_validator = await user_password_validator();
    const errors = password_validator.validate(password, {
      list: true,
    });
    if (Array.isArray(errors) && errors.length > 0)
      throw new AppError('Senha inválida', 400);
    const identity_exists = await this.identity_repository.find_by_email(email);
    if (identity_exists)
      throw new AppError('Usuário já cadastrado no sistema', 400);
    const password_hash = await argon2.hash(password);
    /*
     * 1. Cria o Tenant/Entity
     */
    const entity = new Entity({
      name: entity_name,
      type: EntityMapper.EntityDomainType(entity_type),
      status: EntityStatus.ATIVO,
    });
    await this.entity_repository.create(entity);
    /*
     * 2. Cria a Identity
     */
    const identity = new Identity({
      email,
      password_hash,
      mfa_required: false,
      provider: IdentityMapper.IdentityAuthProvider('LOCAL'),
      status: IdentityStatus.ATIVO,
    });
    await this.identity_repository.create(identity);
    /*
     * 3. Cria o Profile
     */
    const profile = new Profile({
      identity_id: identity.id,
      name: name,
      birth_date: birth_date,
      phone: phone ? phone : null,
      photo: photo ? photo : null,
    });
    await this.profile_repository.create(profile);

    /*
     * 4. Vincula o usuário ao Tenant
     */
    const membership = new Entity_Membership({
      entity_id: entity._id,
      profile_id: profile.id,
      role: MemberRole.DONO,
      status: 'ATIVO',
    });
    await this.membership_repository.create(membership);
    return 'Usuário cadastrado com sucesso';
  }
}
