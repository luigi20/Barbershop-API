import { Injectable } from '@nestjs/common';
import { GoogleProviderService } from './google_provider.service';
import { AppError } from '@modules/utils/app_error';
//import { MicrosoftProviderService } from './microsoft_provider.service';

// auth/interfaces/social-profile.interface.ts
export interface SocialProfile {
  id: string;
  email: string;
  name?: string;
  last_name: string;
  avatar?: string | null;
}

@Injectable()
export class IdentityProviderService {
  constructor(
    private readonly googleProvider: GoogleProviderService,
    // private readonly microsoftProvider: MicrosoftProviderService,
  ) {}

  async validate(provider: string, token: string): Promise<SocialProfile> {
    switch (provider) {
      case 'google':
        return await this.googleProvider.validate(token);
      case 'microsoft':
        //    return await this.microsoftProvider.validate(token);
        break;
      default:
        throw new AppError('Provider não suportado');
    }
  }
}
