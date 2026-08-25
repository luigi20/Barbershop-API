import { Address } from '@modules/auth/address/shared/models/address';
import { Address as PrismaAddress } from '@prisma/client';
export class AddressMapper {
  static toPrisma(address: Address) {
    return {
      id: address._id,
      street: address.street,
      created_at: address.created_at,
      updated_at: address.updated_at,
      number: address.number,
      neighborhood: address.neighborhood,
      complement: address.complement ? address.complement : null,
      state: address.state,
      country: address.country,
      zip_code: address.zip_code,
      latitude: address.latitude,
      longitude: address.longitude,
      city: address.city,
    };
  }

  static toDomain(raw: PrismaAddress): Address {
    return new Address(
      {
        entity_id: raw.entity_id,
        city: raw.city,
        street: raw.street,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        number: raw.number,
        neighborhood: raw.neighborhood,
        complement: raw.complement ? raw.complement : null,
        state: raw.state,
        country: raw.country,
        zip_code: raw.zip_code,
        latitude: raw.latitude ? Number(raw.latitude) : null,
        longitude: raw.longitude ? Number(raw.longitude) : null,
      },
      raw.id,
    );
  }
}
