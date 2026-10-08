import { JwtService } from '@nestjs/jwt';
import { LogoutService } from '../service/logout.service';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';

describe('Logout', () => {
  it('rejects a non-refresh token', async () => {
    const jwt = new JwtService({ secret: 'p0-test-only-secret' });
    const token = jwt.sign({
      sub: 'identity-a',
      type: 'access',
      sid: 'session-a',
    });
    const service = new LogoutService(
      new InMemoryRefreshTokensRepository(),
      jwt,
    );
    await expect(service.execute(token, 'identity-a')).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
