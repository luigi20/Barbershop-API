import { Entity } from '../models/entity';

export class EntityViewModel {
  static toHttp(entity: Entity) {
    return {
      id: entity._id,
      document: entity.document ? entity.document : null,
      email: entity.email ? entity.email : null,
      phone: entity.phone ? entity.phone : null,
      photo: entity.photo ? entity.photo : null,
      status: entity.status,
      type: entity.type,
      city: entity.address.city,
      country: entity.address.country,
      latitude: entity.address.latitude,
      longitude: entity.address.longitude,
      neighborhood: entity.address.neighborhood,
      number: entity.address.number,
      state: entity.address.state,
      street: entity.address.street,
      zip_code: entity.address.zip_code,
      complement: entity?.address?.complement ?? null,
    };
  }
}
