import { Identity } from '@modules/auth/identity/shared/models/identity';
import { Replace } from '@modules/utils/helper';
import { randomUUID } from 'crypto';

export interface Profile_Props {
  identity_id: string;
  identity: Identity;
  name: string;
  phone: string;
  photo: string;
  status: string;
  roles: string[];
  birth_date: Date;
  created_at: Date;
  updated_at: Date;
}

export class Profile {
  private _id: string;
  private props: Profile_Props;

  constructor(
    props: Replace<
      Profile_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        photo?: string;
        identity?: Identity;
        roles?: string[];
        phone?: string;
        birth_date?: Date;
        status?: string;
      }
    >,
    id?: string,
  ) {
    this._id = id ?? randomUUID();
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      photo: props.photo ?? null,
      identity: props.identity ?? null,
      roles: props.roles ?? [],
      phone: props.phone ?? null,
      birth_date: props.birth_date ?? null,
      status: props.status ?? null,
    };
  }

  public get id() {
    return this._id;
  }

  public get status(): string {
    return this.props.status;
  }

  public set status(status: string) {
    this.props.status = status;
  }

  public get identity_id(): string {
    return this.props.identity_id;
  }

  public set identity_id(identity_id: string) {
    this.props.identity_id = identity_id;
  }

  public get identity(): Identity {
    return this.props.identity;
  }

  public set identity(identity: Identity) {
    this.props.identity = identity;
  }

  public get name(): string {
    return this.props.name;
  }

  public set name(name: string) {
    this.props.name = name;
  }

  public get birth_date(): Date {
    return this.props.birth_date;
  }

  public set birth_date(birth_date: Date) {
    this.props.birth_date = birth_date;
  }

  public get phone(): string {
    return this.props.phone;
  }

  public set phone(phone: string) {
    this.props.name = phone;
  }

  public get photo(): string {
    return this.props.photo;
  }

  public set photo(photo: string) {
    this.props.photo = photo;
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

  public get roles(): string[] {
    return this.props.roles;
  }
  public set roles(roles: string[]) {
    this.props.roles = roles;
  }
}
