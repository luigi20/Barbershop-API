import { Injectable } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';
import forge from 'node-forge';

export interface JwkKey {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  n: string;
  e: string;
}

@Injectable()
export class JWKSService {
  constructor() {}

  public async execute(): Promise<JwkKey[]> {
    const public_key = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    const public_key_forge = forge.pki.publicKeyFromPem(public_key);
    const n_b64 = Buffer.from(public_key_forge.n.toByteArray()).toString(
      'base64url',
    );
    const e_b64 = Buffer.from(public_key_forge.e.toByteArray()).toString(
      'base64url',
    );
    const keys = [
      {
        kty: 'RSA',
        use: 'sig',
        kid: 'v1',
        alg: 'RS256',
        n: n_b64,
        e: e_b64,
      },
    ];
    return keys;
  }
}
