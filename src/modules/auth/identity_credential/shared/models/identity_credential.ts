import { Identity } from '@modules/auth/identity/shared/models/identity';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { AuthProvider, IdentityStatus } from '@modules/utils/enum';
import { Replace } from '@modules/utils/helper';
import { randomUUID } from 'crypto';

export interface Identity_Credential_Props {
  identity_id: string;
  provider: string;
  provider_id: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  identity: Identity;
}

export class Identity_Credential {
  private _id: string;
  private props: Identity_Credential_Props;

  constructor(
    props: Replace<
      Identity_Credential_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        provider_id?: string;
        password_hash?: string;
        identity?: Identity;
      }
    >,
    id?: string,
  ) {
    this._id = id ?? randomUUID();
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      provider_id: props.provider_id ?? null,
      password_hash: props.password_hash ?? null,
      identity: props.identity ?? null,
    };
  }

  public get id() {
    return this._id;
  }

  public get identity_id(): string {
    return this.props.identity_id;
  }

  public set identity_id(identity_id: string) {
    this.props.identity_id = identity_id;
  }

  public get provider(): string {
    return this.props.provider;
  }

  public set provider(provider: string) {
    this.props.provider = provider;
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

  public get provider_id(): string {
    return this.props.provider_id;
  }

  public set provider_id(provider_id: string) {
    this.props.provider_id = provider_id;
  }

  public get password_hash(): string {
    return this.props.password_hash;
  }

  public set password_hash(password_hash: string) {
    this.props.password_hash = password_hash;
  }

  public get identity(): Identity {
    return this.props.identity;
  }

  public set identity(identity: Identity) {
    this.props.identity = identity;
  }
}
