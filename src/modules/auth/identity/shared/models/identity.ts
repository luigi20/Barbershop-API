import { Profile } from '@modules/auth/profile/shared/models/profile';
import { AuthProvider, IdentityStatus } from '@modules/utils/enum';
import { Replace } from '@modules/utils/helper';
import { randomUUID } from 'crypto';

export interface Identity_Props {
  mfa_required: boolean;
  created_at: Date;
  updated_at: Date;
  email: string;
  is_superuser: boolean;
  status: string;
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
        is_superuser?: boolean;
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
      profile: props.profile ?? null,
      is_superuser: props.is_superuser ?? false,
    };
  }

  public get id() {
    return this._id;
  }

  public get is_superuser(): boolean {
    return this.props.is_superuser;
  }

  public set is_superuser(is_superuser: boolean) {
    this.props.is_superuser = is_superuser;
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

  public get status(): string {
    return this.props.status;
  }

  public set status(status: string) {
    this.props.status = status;
  }

  public get email(): string {
    return this.props.email;
  }

  public set email(email: string) {
    this.props.email = email;
  }
}
