import { Body, Controller, Put, Req } from '@nestjs/common';
import { Profile_View_Model } from '@modules/auth/profile/shared/view-models/profile-view-model';
import { AuthRequest } from '@modules/utils/types/types';
import { ChangeProfileService } from '../service/change_profile.service';
import { ChangeProfileDTO } from '../dto/change-profile-DTO';

@Controller()
export class ChangeProfileController {
  constructor(private readonly change_profile_service: ChangeProfileService) {}

  @Put('change_profile')
  public async ChangeProfile(
    @Req() req: AuthRequest,
    @Body() data: ChangeProfileDTO,
  ) {
    const result = await this.change_profile_service.execute({
      profile_id: req.auth.profile_id,
      name: data.name,
      photo_url: data.photo_url,
      birth_date: data.birth_date,
      phone: data.phone,
    });
    return Profile_View_Model.toHttp(result);
  }
}
