import { createHash } from 'crypto';
import PasswordValidator from 'password-validator';
import * as generator from 'generate-password';

export async function user_password_validator(): Promise<PasswordValidator> {
  const passwordSchema = new PasswordValidator();
  passwordSchema
    .is()
    .min(10)
    .is()
    .max(100)
    .has()
    .uppercase()
    .has()
    .lowercase()
    .has()
    .digits()
    .has()
    .symbols()
    .has()
    .not()
    .spaces();
  return passwordSchema;
}

export async function Generate_Code(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateValidRandomPassword(): Promise<string> {
  const password = generator.generate({
    length: 16, // Atende a regra min(10) e max(100)
    numbers: true, // Atende a regra has().digits()
    symbols: true, // Atende a regra has().symbols()
    lowercase: true, // Atende a regra has().lowercase()
    uppercase: true, // Atende a regra has().uppercase()
    exclude: ' ', // Atende a regra not().spaces()
    strict: true, // GARANTE que tenha pelo menos um de cada acima
  });

  return password;
}

export async function Generate_Hash(value: string): Promise<string> {
  return createHash('sha256').update(value).digest('hex');
}
