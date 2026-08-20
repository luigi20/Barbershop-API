import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { Entity_Customer } from '@modules/business/entity_customer/shared/models/entity_customer';
import { Identity_Credential } from '@modules/auth/identity_credential/shared/models/identity_credential';
interface IMembersRequest {
  entity_id: string;
  email: string;
  mfa_required: boolean;
  name: string;
  phone: string;
  photo: string;
  birth_date: string;
  notes: string;
  status: string;
}

@Injectable()
export class EntityCustomerUpdateService {
  constructor(
    private readonly entity_customer_repository: IEntityCustomerRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly prisma: PrismaService,
  ) {}

  public async execute({
    birth_date,
    email,
    mfa_required,
    name,
    phone,
    photo,
    notes,
    entity_id,
    status,
  }: IMembersRequest): Promise<Entity_Customer> {
    const info_entity =
      await this.entity_repository.findByIdSelectIdAndName(entity_id);
    if (!info_entity) throw new AppError('Empresa não existe', 404);
    const identity_exists = await this.identity_repository.find_by_email(email);
    if (!identity_exists) throw new AppError('Credenciais inválidas', 400);
    const profile_exists = await this.profile_repository.find_identity_id(
      identity_exists.id,
    );
    if (!profile_exists) throw new AppError('Perfil não existe', 404);
    const entity_customer_exists =
      await this.entity_customer_repository.find_one(
        info_entity.id,
        profile_exists.id,
      );
    if (!entity_customer_exists)
      throw new AppError('Usuário não pertence a essa organização', 404);
    const identity = new Identity(
      {
        email: email,
        mfa_required: mfa_required,
        status: status,
        is_superuser: identity_exists.is_superuser,
        last_login_at: identity_exists.last_login_at,
        created_at: identity_exists.created_at,
      },
      identity_exists.id,
    );
    const profile = new Profile(
      {
        identity_id: profile_exists.identity_id,
        name: name,
        birth_date: new Date(birth_date),
        phone: phone,
        photo: photo,
        roles: ['cliente'],
        status: status,
      },
      profile_exists.id,
    );
    const entity_customer = new Entity_Customer({
      entity_id: entity_customer_exists.entity_id,
      profile_id: profile.id,
      notes: notes,
      status: status,
      birth_date: new Date(birth_date),
      phone: phone,
      photo: photo,
      name: name,
      profile_name: profile.name,
      entity_name: info_entity.name,
    });
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.identity_repository.create(identity, tx);
        await this.profile_repository.create(profile, tx);
        await this.entity_customer_repository.create(entity_customer, tx);
      });
    } catch (error) {
      throw new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        500,
      );
    }
    return entity_customer;
  }
}
