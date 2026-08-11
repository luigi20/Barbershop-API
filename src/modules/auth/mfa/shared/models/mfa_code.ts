import { Replace } from '@modules/utils/helper';
import { randomUUID } from 'crypto';

export interface MFA_Code_Props {
  identity_id: string;
  type: string;
  code_hash: string;
  expires_at: Date;
  used_at: boolean;
  attempts: number;
  created_at: Date;
  updated_at: Date;
}

export class MFA_Code {
  private _id: string;
  private props: MFA_Code_Props;

  constructor(
    props: Replace<
      MFA_Code_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        expires_at?: Date;
      }
    >,
    id?: string,
  ) {
    this._id = id ?? randomUUID();
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      expires_at: props.expires_at ?? new Date(Date.now() + 15 * 60 * 1000),
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

  public get code_hash(): string {
    return this.props.code_hash;
  }

  public set code_hash(code_hash: string) {
    this.props.code_hash = code_hash;
  }

  public get type(): string {
    return this.props.type;
  }

  public set type(type: string) {
    this.props.type = type;
  }

  public get attempts(): number {
    return this.props.attempts;
  }

  public set attempts(attempts: number) {
    this.props.attempts = attempts;
  }

  public get expires_at(): Date {
    return this.props.expires_at;
  }

  public set expires_at(expires_at: Date) {
    this.props.expires_at = expires_at;
  }

  public get used_at(): boolean {
    return this.props.used_at;
  }

  public set used_at(used_at: boolean) {
    this.props.used_at = used_at;
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
