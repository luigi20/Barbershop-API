import { Refresh_Tokens } from '../../models/refresh-tokens';

abstract class IRefreshTokensRepository {
  abstract find_session(id: string): Promise<Refresh_Tokens | null>;
  abstract rotate(
    id: string,
    previousHash: string,
    nextHash: string,
    now: Date,
  ): Promise<boolean>;
  abstract revoke_session(id: string, identity_id: string): Promise<boolean>;
  abstract create(data: Refresh_Tokens): Promise<void>;
  abstract find_by_hash(token_hash: string): Promise<string | null>;
  abstract find_one(
    identity_id: string,
    revoked: boolean,
    now: Date,
  ): Promise<Refresh_Tokens | null>;
  abstract update_revoked(id: string): Promise<void>;
}
export { IRefreshTokensRepository };
