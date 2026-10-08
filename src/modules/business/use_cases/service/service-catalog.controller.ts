import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardAccess } from '@modules/auth/guards/auth_guard_access';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { AuthRequest } from '@modules/utils/types/types';
import { tenantId } from '@modules/auth/security/request-security';
import { MemberRole, TokenType } from '@modules/utils/enum';
import { ServiceViewModel } from '@modules/business/service/shared/view-models/service-view-model';
import { ManagementAppErrorFilter } from '../management-app-error.filter';
import { ServiceCreateDTO } from './dto/service-create.dto';
import { ServiceUpdateDTO } from './dto/service-update.dto';
import { ServiceCatalogService } from './service-catalog.service';

@ApiTags('Service')
@ApiBearerAuth('access-token')
@UseFilters(ManagementAppErrorFilter)
@UseGuards(AuthGuardAccess, RolesGuard)
@TokenTypeRequired(TokenType.ACCESS)
@Controller('service')
export class ServiceCatalogController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Get('get_all')
  @Roles(
    MemberRole.ADMINISTRADOR,
    MemberRole.RECEPCIONISTA,
    MemberRole.BARBEIRO,
    MemberRole.CLIENTE,
  )
  async list(@Req() req: AuthRequest) {
    const rows = await this.catalog.list(
      tenantId(req.auth, req.auth.entity_id),
    );
    return rows.map((row) => ServiceViewModel.toHttp(row));
  }

  @Get('get_one/:id')
  @Roles(
    MemberRole.ADMINISTRADOR,
    MemberRole.RECEPCIONISTA,
    MemberRole.BARBEIRO,
    MemberRole.CLIENTE,
  )
  async detail(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ServiceViewModel.toHttp(
      await this.catalog.detail(tenantId(req.auth, req.auth.entity_id), id),
    );
  }

  @Post('create')
  @Roles(MemberRole.ADMINISTRADOR)
  async create(@Req() req: AuthRequest, @Body() body: ServiceCreateDTO) {
    return ServiceViewModel.toHttp(
      await this.catalog.create(tenantId(req.auth, req.auth.entity_id), body),
    );
  }

  @Put('update/:id')
  @Roles(MemberRole.ADMINISTRADOR)
  async update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ServiceUpdateDTO,
  ) {
    return ServiceViewModel.toHttp(
      await this.catalog.update(
        tenantId(req.auth, req.auth.entity_id),
        id,
        body,
      ),
    );
  }
}
