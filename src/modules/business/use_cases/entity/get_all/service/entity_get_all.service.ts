import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EntityGetAllService {
  constructor(private readonly entity_repository: IEntityRepository) {}

  public async execute(): Promise<Entity[]> {
    const list_plan = await this.entity_repository.list();
    return list_plan;
  }
}
