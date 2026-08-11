import { MFA_Code } from '../../models/mfa_code';

abstract class IMFACodeRepository {
  abstract create(data: MFA_Code): Promise<void>;
  abstract update_used(id: string): Promise<void>;
}
export { IMFACodeRepository };
