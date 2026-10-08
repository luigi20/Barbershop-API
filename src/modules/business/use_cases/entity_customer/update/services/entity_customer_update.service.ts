import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { Entity_Customer } from '@modules/business/entity_customer/shared/models/entity_customer';
import { ICustomerRepository } from '@modules/business/customer/shared/repositories/abstract_class/icustomer-repository';

interface IMembersRequest {
  entity_id: string;
  customer_id: string;
  notes?: string;
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
    private readonly customer_repository: ICustomerRepository,
  ) {}

  public async execute({
    customer_id,
    notes,
    entity_id,
    status,
  }: IMembersRequest): Promise<Entity_Customer> {
    const info_entity =
      await this.entity_repository.findByIdSelectIdAndName(entity_id);
    if (!info_entity) throw new AppError('Empresa não existe', 404);
    const customer_exists =
      await this.customer_repository.find_one(customer_id);
    if (!customer_exists) throw new AppError('Cliente não existe', 404);
    const entity_customer_exists =
      await this.entity_customer_repository.find_one(
        info_entity.id,
        customer_exists._id,
      );
    if (!entity_customer_exists)
      throw new AppError('Usuário não pertence a essa organização', 404);
    const profile_exists = customer_exists.profile_id
      ? await this.profile_repository.find_one(customer_exists.profile_id)
      : null;
    const entity_customer = new Entity_Customer({
      entity_id: entity_customer_exists.entity_id,
      customer_id: customer_exists._id,
      notes: notes === undefined ? entity_customer_exists.notes : notes,
      status,
      created_at: entity_customer_exists.created_at,
      profile_name: profile_exists?.name,
      phone: profile_exists?.phone,
      photo: profile_exists?.photo,
      birth_date: profile_exists?.birth_date,
      entity_name: info_entity.name,
      profile_id: customer_exists.profile_id,
      email: profile_exists
        ? (
            await this.identity_repository.find_by_id(
              profile_exists.identity_id,
            )
          )?.email
        : null,
    });
    const prisma = this.prisma.getPrismaClient();
    try {
      await prisma.$transaction(async (tx) => {
        await this.entity_customer_repository.update(entity_customer, tx);
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
