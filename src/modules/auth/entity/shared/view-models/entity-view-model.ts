import { Entity } from '../models/entity';

export class EntityViewModel {
  static toHttp(entity: Entity) {
    return {
      id: entity._id,
      name: entity.name,
      document: entity.document ? entity.document : null,
      email: entity.email ? entity.email : null,
      phone: entity.phone ? entity.phone : null,
      photo: entity.photo ? entity.photo : null,
      status: entity.status,
      type: entity.type,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      city: entity.address?.city ?? null,
      country: entity.address?.country ?? null,
      latitude: entity.address?.latitude ?? null,
      longitude: entity.address?.longitude ?? null,
      neighborhood: entity.address?.neighborhood ?? null,
      number: entity.address?.number ?? null,
      state: entity.address?.state ?? null,
      street: entity.address?.street ?? null,
      zip_code: entity.address?.zip_code ?? null,
      complement: entity?.address?.complement ?? null,
    };
  }
}
