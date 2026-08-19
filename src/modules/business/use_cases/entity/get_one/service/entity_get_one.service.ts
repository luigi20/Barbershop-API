import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';

interface IEntityRequest {
  id: string;
}

@Injectable()
export class EntityGetOneService {
  constructor(private readonly entity_repository: IEntityRepository) {}

  public async execute({ id }: IEntityRequest): Promise<Entity> {
    const entity = await this.entity_repository.findById(id);
    if (!entity) throw new AppError('Empresa não existe', 404);
    return entity;
  }
}
