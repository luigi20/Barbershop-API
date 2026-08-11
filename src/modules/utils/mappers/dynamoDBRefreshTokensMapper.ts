import { Password_Reset_Tokens } from '@modules/auth/password_reset_tokens/shared/models/password-reset-tokens';
import { Refresh_Tokens } from '@modules/auth/refresh_token/shared/models/refresh-tokens';

export class DynamoDBRefreshTokensMapper {
  static toDynamo(refresh_token: Refresh_Tokens) {
    return {
      id: refresh_token.id,
      entity_id: refresh_token.entity_id,
      context_id: refresh_token.context_id,
      token_hash: refresh_token.token_hash,
      expires_at: refresh_token.expires_at,
      revoked: refresh_token.revoked,
      created_at: refresh_token.created_at,
      updated_at: refresh_token.updated_at,
    };
  }

  static toDomain(raw: Refresh_Tokens): Refresh_Tokens {
    return new Refresh_Tokens(
      {
        context_id: raw.context_id,
        entity_id: raw.entity_id,
        token_hash: raw.token_hash,
        expires_at: raw.expires_at,
        revoked: raw.revoked,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
