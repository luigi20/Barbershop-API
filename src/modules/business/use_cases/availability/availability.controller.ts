import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardAccess } from '@modules/auth/guards/auth_guard_access';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { tenantId } from '@modules/auth/security/request-security';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { ManagementAppErrorFilter } from '../management-app-error.filter';
import { AvailabilityService } from './availability.service';
import { BlockDTO, ReplaceHoursDTO, TimezoneDTO } from './availability.dto';

@ApiTags('Availability')
@ApiBearerAuth('access-token')
@UseFilters(ManagementAppErrorFilter)
@UseGuards(AuthGuardAccess, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  private tenant(req: AuthRequest) {
    return tenantId(req.auth, req.auth.entity_id);
  }

  @Get('timezone')
  @Roles(MemberRole.ADMINISTRADOR)
  timezone(@Req() req: AuthRequest) {
    return this.availability.getTimezone(this.tenant(req));
  }

  @Put('timezone')
  @Roles(MemberRole.ADMINISTRADOR)
  setTimezone(@Req() req: AuthRequest, @Body() body: TimezoneDTO) {
    return this.availability.setTimezone(this.tenant(req), body.timezone);
  }

  @Get('business-hours')
  @Roles(MemberRole.ADMINISTRADOR)
  business(@Req() req: AuthRequest) {
    return this.availability.getBusiness(this.tenant(req));
  }

  @Put('business-hours')
  @Roles(MemberRole.ADMINISTRADOR)
  replaceBusiness(@Req() req: AuthRequest, @Body() body: ReplaceHoursDTO) {
    return this.availability.replaceBusiness(this.tenant(req), body.periods);
  }

  @Get('professionals/:profileId/hours')
  @Roles(MemberRole.ADMINISTRADOR)
  professional(
    @Req() req: AuthRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.availability.getProfessional(this.tenant(req), profileId);
  }

  @Put('professionals/:profileId/hours')
  @Roles(MemberRole.ADMINISTRADOR)
  replaceProfessional(
    @Req() req: AuthRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: ReplaceHoursDTO,
  ) {
    return this.availability.replaceProfessional(
      this.tenant(req),
      profileId,
      body.periods,
    );
  }

  @Get('professionals/:profileId/blocks')
  @Roles(MemberRole.ADMINISTRADOR)
  blocks(
    @Req() req: AuthRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.availability.listBlocks(this.tenant(req), profileId, from, to);
  }

  @Post('professionals/:profileId/blocks')
  @Roles(MemberRole.ADMINISTRADOR)
  createBlock(
    @Req() req: AuthRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: BlockDTO,
  ) {
    return this.availability.createBlock(this.tenant(req), profileId, body);
  }

  @Put('professionals/:profileId/blocks/:id')
  @Roles(MemberRole.ADMINISTRADOR)
  updateBlock(
    @Req() req: AuthRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BlockDTO,
  ) {
    return this.availability.updateBlock(this.tenant(req), profileId, id, body);
  }

  @Delete('professionals/:profileId/blocks/:id')
  @Roles(MemberRole.ADMINISTRADOR)
  removeBlock(
    @Req() req: AuthRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.availability.removeBlock(this.tenant(req), profileId, id);
  }
}
