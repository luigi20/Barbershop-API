import { Injectable } from '@nestjs/common';
import { GoogleOAuthClientService } from './google_oauth_client.service';
import { SocialProfile } from './identity_provider.service';
import { AppError } from '@modules/utils/app_error';

@Injectable()
export class GoogleProviderService {
  private client = new GoogleOAuthClientService().getClient();

  async validate(token: string): Promise<SocialProfile> {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new AppError('Token Google Inválido');
    }
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.given_name,
      last_name: payload.family_name,
      avatar: payload.picture,
      type: 'google',
    };
  }
}
