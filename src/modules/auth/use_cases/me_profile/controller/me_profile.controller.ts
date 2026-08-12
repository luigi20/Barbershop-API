import { Controller, Get, Req } from '@nestjs/common';
import { Profile_View_Model } from '@modules/auth/profile/shared/view-models/profile-view-model';
import { AuthRequest } from '@modules/utils/types/types';
import { MeProfileService } from '../service/me_profile.service';

@Controller()
export class MeProfileController {
  constructor(private readonly me_profile_service: MeProfileService) {}

  @Get('me_profile')
  public async MeProfile(@Req() req: AuthRequest) {
    const result = await this.me_profile_service.execute({
      profile_id: req.auth.profile_id,
      entity_id: req.auth.entity_id,
    });
    return Profile_View_Model.toHttp(result);
  }
}
