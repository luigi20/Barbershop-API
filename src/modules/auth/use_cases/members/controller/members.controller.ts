import { Controller, Get, Req } from '@nestjs/common';
import { MembersService } from '../services/members.service';
import { Profile_View_Model } from '@modules/auth/profile/shared/view-models/profile-view-model';
import { AuthRequest } from '@modules/utils/types/types';
import { Entity_Membership_View_Model } from '@modules/auth/entity_membership/shared/view-models/entity-membership-view-model';

@Controller('members')
export class MembersController {
  constructor(private readonly members_service: MembersService) {}

  @Get()
  public async Members(@Req() req: AuthRequest) {
    const result = await this.members_service.execute({
      entity_id: req.auth.entity_id,
      identity_id: req.auth.identity_id,
    });
    return result.map((item) => Entity_Membership_View_Model.toHttp(item));
  }
}
