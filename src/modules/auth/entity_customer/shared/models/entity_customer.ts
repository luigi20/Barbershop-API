import { Replace } from '@modules/utils/helper';

export interface Entity_Customer_Props {
  entity_id: string;
  name: string;
  profile_id: string;
  notes: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class Entity_Customer {
  private props: Entity_Customer_Props;

  constructor(
    props: Replace<
      Entity_Customer_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        notes?: string;
        name?: string;
      }
    >,
    id?: string,
  ) {
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      notes: props.notes ?? null,
      name: props.name ?? null,
    };
  }

  public get entity_id(): string {
    return this.props.entity_id;
  }

  public set entity_id(entity_id: string) {
    this.props.entity_id = entity_id;
  }

  public get profile_id(): string {
    return this.props.profile_id;
  }

  public set profile_id(profile_id: string) {
    this.props.profile_id = profile_id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get notes(): string {
    return this.props.notes;
  }

  public set notes(notes: string) {
    this.props.notes = notes;
  }

  public get status(): string {
    return this.props.status;
  }

  public set status(status: string) {
    this.props.status = status;
  }

  public get created_at(): Date {
    return this.props.updated_at;
  }

  public set created_at(created_at: Date) {
    this.props.created_at = created_at;
  }

  public get updated_at(): Date {
    return this.props.updated_at;
  }

  public set updated_at(updated_at: Date) {
    this.props.updated_at = updated_at;
  }
}
