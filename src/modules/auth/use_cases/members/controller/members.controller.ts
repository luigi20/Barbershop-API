import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { MembersService } from '../services/members.service';
import { AuthRequest } from '@modules/utils/types/types';
import { Entity_Membership_View_Model } from '@modules/auth/entity_membership/shared/view-models/entity-membership-view-model';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.ACCESS)
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
