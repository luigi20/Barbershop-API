import { Appointment } from '@prisma/client';

export class AppointmentMapper {
  static toHttp(
    row: Appointment,
    customerName: string | null,
    professionalName: string | null,
  ) {
    return {
      id: row.id,
      entity_id: row.entity_id,
      customer_id: row.customer_id,
      customer_name: customerName,
      professional_profile_id: row.professional_profile_id,
      professional_name: professionalName,
      service_id: row.service_id,
      service_name: row.service_name_snapshot,
      price: row.price_snapshot.toFixed(2),
      duration_minutes: row.duration_minutes_snapshot,
      starts_at: row.starts_at.toISOString(),
      ends_at: row.ends_at.toISOString(),
      status: row.status,
      notes: row.notes,
      cancellation_reason: row.cancellation_reason,
      cancelled_at: row.cancelled_at?.toISOString() ?? null,
      completed_at: row.completed_at?.toISOString() ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
