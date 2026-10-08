import {
  Controller,
  Get,
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
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseFilters(ManagementAppErrorFilter)
@UseGuards(AuthGuardAccess, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  private entityId(req: AuthRequest) {
    return tenantId(req.auth, req.auth.entity_id);
  }

  @Get('operations')
  @Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
  operations(@Req() req: AuthRequest) {
    return this.dashboard.operations(this.entityId(req));
  }

  @Get('summary')
  @Roles(MemberRole.ADMINISTRADOR)
  summary(@Req() req: AuthRequest) {
    return this.dashboard.summary(this.entityId(req));
  }

  @Get('upcoming')
  @Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
  upcoming(@Req() req: AuthRequest, @Query('limit') limit?: string) {
    return this.dashboard.upcoming(this.entityId(req), limit);
  }

  @Get('timeseries')
  @Roles(MemberRole.ADMINISTRADOR)
  timeseries(
    @Req() req: AuthRequest,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dashboard.timeseries(this.entityId(req), from, to);
  }
}
