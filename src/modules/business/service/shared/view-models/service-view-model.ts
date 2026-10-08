import { BarberService } from '../models/service';

export class ServiceViewModel {
  static toHttp(service: BarberService) {
    return {
      id: service.id,
      entity_id: service.entity_id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration_minutes: service.duration_minutes,
      status: service.status,
      created_at: service.created_at,
      updated_at: service.updated_at,
    };
  }
}
