import { Profile } from '@modules/auth/profile/shared/models/profile';
import { AuthProvider, IdentityStatus } from '@modules/utils/enum';
import { Replace } from '@modules/utils/helper';
import { randomUUID } from 'crypto';

export interface Identity_Props {
  mfa_required: boolean;
  created_at: Date;
  updated_at: Date;
  email: string;
  password_hash: string;
  provider: AuthProvider;
  provider_id: string;
  status: IdentityStatus;
  last_login_at: Date;
  profile: Profile;
}

export class Identity {
  private _id: string;
  private props: Identity_Props;

  constructor(
    props: Replace<
      Identity_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        last_login_at?: Date;
        provider_id?: string;
        profile?: Profile;
      }
    >,
    id?: string,
  ) {
    this._id = id ?? randomUUID();
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      last_login_at: props.last_login_at ?? new Date(),
      provider_id: props.provider_id ?? null,
      profile: props.profile ?? null,
    };
  }

  public get id() {
    return this._id;
  }

  public get password_hash(): string {
    return this.props.password_hash;
  }

  public set password_hash(password_hash: string) {
    this.props.password_hash = password_hash;
  }

  public get mfa_required(): boolean {
    return this.props.mfa_required;
  }

  public set mfa_required(mfa_required: boolean) {
    this.props.mfa_required = mfa_required;
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

  public get profile(): Profile {
    return this.props.profile;
  }

  public set profile(profile: Profile) {
    this.props.profile = profile;
  }

  public get last_login_at(): Date {
    return this.props.last_login_at;
  }

  public set last_login_at(last_login_at: Date) {
    this.props.last_login_at = last_login_at;
  }

  public get status(): IdentityStatus {
    return this.props.status;
  }

  public set status(status: IdentityStatus) {
    this.props.status = status;
  }

  public get provider_id(): string {
    return this.props.provider_id;
  }

  public set provider_id(provider_id: string) {
    this.props.provider_id = provider_id;
  }

  public get provider(): AuthProvider {
    return this.props.provider;
  }

  public set provider(provider: AuthProvider) {
    this.props.provider = provider;
  }

  public get email(): string {
    return this.props.email;
  }

  public set email(email: string) {
    this.props.email = email;
  }
}
