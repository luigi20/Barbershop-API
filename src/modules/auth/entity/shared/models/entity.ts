import { randomUUID } from 'crypto';
import { Replace } from '@utils/helper';
import { EntityStatus, EntityType } from '@modules/utils/enum';

export interface Entity_Props {
  email: string;
  created_at: Date;
  updated_at: Date;
  type: string;
  name: string;
  document: string;
  phone: string;
  photo: string;
  status: string;
}

export class Entity {
  private id: string;
  private props: Entity_Props;

  constructor(
    props: Replace<
      Entity_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        document?: string;
        email?: string;
        phone?: string;
        photo?: string;
      }
    >,
    id?: string,
  ) {
    this.id = id ?? randomUUID();
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      document: props.document ?? null,
      email: props.email ?? null,
      phone: props.phone ?? null,
      photo: props.photo ?? null,
    };
  }

  public get _id() {
    return this.id;
  }

  public get email(): string {
    return this.props.email;
  }

  public set email(email: string) {
    this.props.email = email;
  }

  public get created_at(): Date {
    return this.props.created_at;
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

  public get document(): string {
    return this.props.document;
  }

  public set document(document: string) {
    this.props.document = document;
  }

  public get phone(): string {
    return this.props.phone;
  }

  public set phone(phone: string) {
    this.props.phone = phone;
  }

  public get photo(): string {
    return this.props.photo;
  }

  public set photo(photo: string) {
    this.props.photo = photo;
  }

  public get name(): string {
    return this.props.name;
  }

  public set name(name: string) {
    this.props.name = name;
  }

  public get type(): string {
    return this.props.type;
  }

  public set type(type: string) {
    this.props.type = type;
  }

  public get status(): string {
    return this.props.status;
  }

  public set status(status: string) {
    this.props.status = status;
  }
}
