import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { userPasswordValidator } from '@modules/utils/functions';
import argon2 from 'argon2';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { Entity_Customer } from '@modules/business/entity_customer/shared/models/entity_customer';

interface IMembersRequest {
  entity_id: string;
  email: string;
  password: string;
  mfa_required: boolean;
  name: string;
  phone: string;
  photo: string;
  birth_date: Date;
  notes: string;
}

@Injectable()
export class EntityCustomerCreateService {
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
    password,
    phone,
    photo,
    notes,
    entity_id,
  }: IMembersRequest): Promise<Entity_Customer> {
    const password_validator = userPasswordValidator();
    const errors = password_validator.validate(password, { list: true });
    if (Array.isArray(errors) && errors.length > 0)
      throw new AppError('Senha inválida', 400);
    const info_entity =
      await this.entity_repository.findByIdSelectIdAndName(entity_id);
    if (!info_entity) throw new AppError('Empresa não existe', 404);
    const identity_exists = await this.identity_repository.find_by_email(email);
    let entity_member_customer: Entity_Customer = null;
    if (!identity_exists) {
      const password_hash = await argon2.hash(password);
      const identity = new Identity({
        email: email,
        mfa_required: mfa_required,
        status: 'ativo',
        is_superuser: false,
        password_hash: password_hash,
        provider: 'local',
      });
      const profile = new Profile({
        identity_id: identity.id,
        name: name,
        birth_date: birth_date,
        phone: phone,
        photo: photo,
        status: 'ativo',
      });
      entity_member_customer = new Entity_Customer({
        entity_id: entity_id,
        profile_id: profile.id,
        notes: notes,
        status: 'ativo',
        birth_date: birth_date,
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
          await this.entity_customer_repository.create(
            entity_member_customer,
            tx,
          );
        });
      } catch (error) {
        throw new AppError(
          'Não foi possível concluir o cadastro. Tente novamente.',
          500,
        );
      }
    } else {
      const profile = await this.profile_repository.find_identity_id(
        identity_exists.id,
      );
      if (!profile) return;
      entity_member_customer = new Entity_Customer({
        entity_id: entity_id,
        profile_id: profile.id,
        notes: notes,
        status: 'ativo',
        birth_date: birth_date,
        phone: phone,
        photo: photo,
        name: name,
        profile_name: profile.name,
        entity_name: info_entity.name,
      });
      await this.entity_customer_repository.create(entity_member_customer);
    }
    return entity_member_customer;
  }
}
