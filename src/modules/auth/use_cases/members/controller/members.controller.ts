import { Controller, Get, Req } from '@nestjs/common';
import { MembersService } from '../services/members.service';
import { Profile_View_Model } from '@modules/auth/profile/shared/view-models/profile-view-model';
import { AuthRequest } from '@modules/utils/types/types';

@Controller('members')
export class MembersController {
  constructor(private readonly members_service: MembersService) {}

  @Get()
  public async Members(@Req() req: AuthRequest) {
    const result = await this.members_service.execute({
      context_id: req.auth.context_id,
      tenant_id: req.auth.tenant_id,
    });
    return result.map((item) => Profile_View_Model.toHttp(item));
  }
}
