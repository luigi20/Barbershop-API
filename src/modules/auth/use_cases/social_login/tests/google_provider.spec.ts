import { AppError } from '@modules/utils/app_error';
import { GoogleProviderService } from '../services/google_provider.service';

const verifyIdTokenMock = jest.fn();

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: verifyIdTokenMock,
    })),
  };
});

describe('Test in route google provider', () => {
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
  });

  it('should not auth social login, because email not exists', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({}),
    });
    const google_provider_service = new GoogleProviderService();
    await expect(
      google_provider_service.validate('fmdjfnhjfr'),
    ).rejects.toThrow(new AppError('Token Google Inválido'));
  });

  it('should auth social login', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-id',
        email: 'user@gmail.com',
        given_name: 'Luis',
        family_name: 'Silva',
        picture: 'avatar.jpg',
      }),
    });
    const google_provider_service = new GoogleProviderService();
    const result = await google_provider_service.validate('fmdjfnhjfr');
    expect(result.id).toBe('google-id');
    expect(result.email).toBe('user@gmail.com');
  });
});
