import { Injectable } from '@nestjs/common';
import { Refresh_Tokens } from '../../models/refresh-tokens';
import { IRefreshTokensRepository } from '../abstract_class/irefresh-tokens-repository';

@Injectable()
export class InMemoryRefreshTokensRepository implements IRefreshTokensRepository {
  public list_refresh_tokens: Refresh_Tokens[] = [];

  find_session(id: string): Promise<Refresh_Tokens | null> {
    return Promise.resolve(
      this.list_refresh_tokens.find((item) => item.id === id) ?? null,
    );
  }
  rotate(
    id: string,
    previousHash: string,
    nextHash: string,
    now: Date,
  ): Promise<boolean> {
    const row = this.list_refresh_tokens.find(
      (item) =>
        item.id === id &&
        item.token_hash === previousHash &&
        !item.revoked_at &&
        item.expires_at > now,
    );
    if (!row) return Promise.resolve(false);
    row.token_hash = nextHash;
    row.updated_at = now;
    return Promise.resolve(true);
  }
  revoke_session(id: string, identity_id: string): Promise<boolean> {
    const row = this.list_refresh_tokens.find(
      (item) => item.id === id && item.identity_id === identity_id,
    );
    if (!row) return Promise.resolve(false);
    row.revoked_at = true;
    return Promise.resolve(true);
  }
  async create(data: Refresh_Tokens): Promise<void> {
    this.list_refresh_tokens.push(data);
  }

  async find_one(
    identity_id: string,
    revoked: boolean,
    now: Date,
  ): Promise<Refresh_Tokens | null> {
    const refresh_tokens = this.list_refresh_tokens.find(
      (item) =>
        item.identity_id === identity_id &&
        item.revoked_at === revoked &&
        item.expires_at > now,
    );
    if (!refresh_tokens) return null;
    return refresh_tokens;
  }

  async find_by_hash(token_hash: string): Promise<string | null> {
    const refresh_tokens = this.list_refresh_tokens.find(
      (item) => item.token_hash === token_hash,
    );
    if (!refresh_tokens) return null;
    return refresh_tokens.id;
  }

  async update_revoked(id: string): Promise<void> {
    const index = this.list_refresh_tokens.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.list_refresh_tokens[index].revoked_at = true;
    }
  }
}
