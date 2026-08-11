import { MFA_Code } from '@modules/auth/mfa/shared/models/mfa_code';

export class DynamoDBMFACodeMapper {
  static toDynamo(mfa_code: MFA_Code) {
    return {
      id: mfa_code.id,
      code: mfa_code.code,
      context_id: mfa_code.context_id,
      entity_id: mfa_code.entity_id,
      expires_at: mfa_code.expires_at,
      used: mfa_code.used,
      created_at: mfa_code.created_at,
      updated_at: mfa_code.updated_at,
    };
  }

  static toDomain(raw: MFA_Code): MFA_Code {
    return new MFA_Code(
      {
        code: raw.code,
        context_id: raw.context_id,
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
