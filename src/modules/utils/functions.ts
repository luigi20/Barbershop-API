import { createHash } from 'crypto';
import PasswordValidator from 'password-validator';
import * as generator from 'generate-password';

export function userPasswordValidator(): PasswordValidator {
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

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateValidRandomPassword(): string {
  return generator.generate({
    length: 16,
    numbers: true,
    symbols: true,
    lowercase: true,
    uppercase: true,
    exclude: ' ',
    strict: true,
  });
}

export function generateHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
