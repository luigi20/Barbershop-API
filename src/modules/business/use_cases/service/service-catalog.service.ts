import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BarberService } from '@modules/business/service/shared/models/service';
import { IServiceRepository } from '@modules/business/service/shared/repositories/iservice-repository';
import { ServiceStatus } from '@modules/utils/enum';
import { ServiceCreateDTO } from './dto/service-create.dto';
import { ServiceUpdateDTO } from './dto/service-update.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly repository: IServiceRepository) {}

  list(entityId: string) {
    return this.repository.findManyByEntity(entityId);
  }

  async detail(entityId: string, id: string) {
    const service = await this.repository.findByIdAndEntity(id, entityId);
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async create(entityId: string, input: ServiceCreateDTO) {
    const name = this.name(input.name);
    const now = new Date();
    return this.repository.create(
      new BarberService({
        entity_id: entityId,
        name,
        description: this.description(input.description),
        price: this.price(input.price),
        duration_minutes: this.duration(input.duration_minutes),
        status: ServiceStatus.ATIVO,
        created_at: now,
        updated_at: now,
      }),
    );
  }

  async update(entityId: string, id: string, input: ServiceUpdateDTO) {
    if (!Object.keys(input).length)
      throw new BadRequestException('Informe um campo para atualizar');
    const current = await this.detail(entityId, id);
    if (
      input.status !== undefined &&
      !Object.values(ServiceStatus).includes(input.status)
    )
      throw new BadRequestException('Status inválido');
    const changed = new BarberService(
      {
        entity_id: current.entity_id,
        name: input.name === undefined ? current.name : this.name(input.name),
        description:
          input.description === undefined
            ? current.description
            : this.description(input.description),
        price:
          input.price === undefined ? current.price : this.price(input.price),
        duration_minutes:
          input.duration_minutes === undefined
            ? current.duration_minutes
            : this.duration(input.duration_minutes),
        status: input.status ?? current.status,
        created_at: current.created_at,
        updated_at: new Date(),
      },
      current.id,
    );
    const result = await this.repository.update(changed);
    if (!result) throw new NotFoundException('Serviço não encontrado');
    return result;
  }

  private name(value: string): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 100)
      throw new BadRequestException('Nome inválido');
    return value.trim();
  }

  private description(value: string | null | undefined): string | null {
    if (value == null) return null;
    if (typeof value !== 'string' || value.trim().length > 500)
      throw new BadRequestException('Descrição inválida');
    return value.trim() || null;
  }

  private price(value: string): string {
    if (typeof value !== 'string' || !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(value))
      throw new BadRequestException('Preço inválido');
    return value;
  }

  private duration(value: number): number {
    if (!Number.isInteger(value) || value < 1 || value > 1440)
      throw new BadRequestException('Duração inválida');
    return value;
  }
}
