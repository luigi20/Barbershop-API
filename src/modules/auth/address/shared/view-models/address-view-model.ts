import { Address } from '../models/address';

export class AddressViewModel {
  static toHttp(address: Address) {
    return {
      id: address._id,
      entity_id: address.entity_id,
      city: address.city,
      neighborhood: address.neighborhood,
      number: address.number,
      state: address.state,
      street: address.street,
      zip_code: address.zip_code,
      country: address.country,
      complement: address.complement ? address.complement : null,
    };
  }
}
