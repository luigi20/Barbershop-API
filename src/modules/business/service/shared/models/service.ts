import { randomUUID } from 'crypto';
import { ServiceStatus } from '@modules/utils/enum';

export interface ServiceProps {
  entity_id: string;
  name: string;
  description: string | null;
  price: string;
  duration_minutes: number;
  status: ServiceStatus;
  created_at: Date;
  updated_at: Date;
}

export class BarberService {
  readonly id: string;
  readonly entity_id!: string;
  readonly name!: string;
  readonly description!: string | null;
  readonly price!: string;
  readonly duration_minutes!: number;
  readonly status!: ServiceStatus;
  readonly created_at!: Date;
  readonly updated_at!: Date;

  constructor(props: ServiceProps, id: string = randomUUID()) {
    this.id = id;
    Object.assign(this, props);
  }
}
