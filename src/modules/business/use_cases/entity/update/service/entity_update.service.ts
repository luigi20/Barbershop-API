import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Plan } from '@modules/business/plan/shared/models/plan';
import { IPlanRepository } from '@modules/business/plan/shared/repositories/abstract_class/iplan-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';

interface IEntityRequest {
  id: string;
  name: string;
  email: string;
  type: string;
  document: string;
  phone: string;
  photo: string;
  status: string;
}

@Injectable()
export class EntityUpdateService {
  constructor(private readonly entity_repository: IEntityRepository) {}

  public async execute({
    document,
    email,
    phone,
    photo,
    status,
    type,
    name,
    id,
  }: IEntityRequest): Promise<Entity> {
    const entity_exists = await this.entity_repository.findById(id);
    if (!entity_exists) throw new AppError('Empresa não existe', 404);
    const entity = new Entity(
      {
        name: name,
        status: status,
        type: type,
        document: document,
        email: email,
        phone: phone,
        photo: photo,
        created_at: entity_exists.created_at,
      },
      entity_exists._id,
    );
    await this.entity_repository.update(entity);
    return entity;
  }
}
