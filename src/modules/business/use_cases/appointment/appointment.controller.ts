import {
  Body,
  Controller,
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
import { AppointmentService } from './appointment.service';
import {
  CancelAppointmentDTO,
  CreateAppointmentDTO,
  RescheduleAppointmentDTO,
} from './appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseFilters(ManagementAppErrorFilter)
@UseGuards(AuthGuardAccess, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointments: AppointmentService) {}

  private actor(req: AuthRequest) {
    return {
      entity_id: tenantId(req.auth, req.auth.entity_id),
      profile_id: req.auth.profile_id,
      roles: req.auth.roles ?? [],
    };
  }

  @Get('availability')
  @Roles(
    MemberRole.ADMINISTRADOR,
    MemberRole.RECEPCIONISTA,
    MemberRole.BARBEIRO,
  )
  availability(
    @Req() req: AuthRequest,
    @Query('date') date: string,
    @Query('professional_profile_id') profileId: string,
    @Query('service_id') serviceId: string,
  ) {
    return this.appointments.availability(
      this.actor(req),
      date,
      profileId,
      serviceId,
    );
  }

  @Get()
  @Roles(
    MemberRole.ADMINISTRADOR,
    MemberRole.RECEPCIONISTA,
    MemberRole.BARBEIRO,
  )
  list(
    @Req() req: AuthRequest,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('professional_profile_id') profileId?: string,
    @Query('customer_id') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.appointments.list(
      this.actor(req),
      from,
      to,
      profileId,
      customerId,
      status,
    );
  }

  @Get(':id')
  @Roles(
    MemberRole.ADMINISTRADOR,
    MemberRole.RECEPCIONISTA,
    MemberRole.BARBEIRO,
  )
  detail(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointments.detail(this.actor(req), id);
  }

  @Post()
  @Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
  create(@Req() req: AuthRequest, @Body() body: CreateAppointmentDTO) {
    return this.appointments.create(this.actor(req), body);
  }

  @Put(':id/reschedule')
  @Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
  reschedule(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RescheduleAppointmentDTO,
  ) {
    return this.appointments.reschedule(this.actor(req), id, body);
  }

  @Put(':id/cancel')
  @Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
  cancel(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelAppointmentDTO,
  ) {
    return this.appointments.cancel(this.actor(req), id, body);
  }

  @Put(':id/complete')
  @Roles(MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA)
  complete(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointments.complete(this.actor(req), id);
  }
}
