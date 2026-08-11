import { Password_Reset_Tokens } from '@modules/auth/password_reset_tokens/shared/models/password-reset-tokens';

export class DynamoDBPasswordResetTokensMapper {
  static toDynamo(password_reset_tokens: Password_Reset_Tokens) {
    return {
      id: password_reset_tokens.id,
      entity_id: password_reset_tokens.entity_id,
      token_hash: password_reset_tokens.token_hash,
      expires_at: password_reset_tokens.expires_at,
      used: password_reset_tokens.used,
      created_at: password_reset_tokens.created_at,
      updated_at: password_reset_tokens.updated_at,
    };
  }

  static toDomain(raw: Password_Reset_Tokens): Password_Reset_Tokens {
    return new Password_Reset_Tokens(
      {
        token_hash: raw.token_hash,
        entity_id: raw.entity_id,
        expires_at: raw.expires_at,
        used: raw.used,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
