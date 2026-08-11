import { JWKSService } from '../service/jwks.service';
import * as forge from 'node-forge';

jest.mock('node-forge', () => {
  return {
    pki: {
      publicKeyFromPem: jest.fn(),
    },
  };
});

describe('Test in route jwks', () => {
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    (forge.pki.publicKeyFromPem as jest.Mock).mockReturnValue({
      n: {
        toByteArray: () => [1, 2, 3, 4],
      },
      e: {
        toByteArray: () => [1, 0, 1],
      },
    });

    process.env.JWT_PUBLIC_KEY = 'fake-key';
  });

  it('should return jwks', async () => {
    const jwks_service = new JWKSService();
    const result = await jwks_service.execute();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kty: 'RSA',
      use: 'sig',
      kid: 'v1',
      alg: 'RS256',
    });
    expect(typeof result[0].n).toBe('string');
    expect(typeof result[0].e).toBe('string');
  });
});
