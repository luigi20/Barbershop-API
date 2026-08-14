import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SelectEntityService } from '../service/select_entity.service';
import { Select_EntityDTO } from '../dto/select_entityDTO';
import { AuthGuard } from '@modules/auth/guards/auth_guard';
import { TokenTypeRequired } from '@modules/auth/decorators/token-type.decorator';
import { TokenType } from '@modules/utils/enum';

@UseGuards(AuthGuard)
@TokenTypeRequired(TokenType.CHALLENGE)
@Controller('auth')
export class SelectEntityController {
  constructor(private readonly selectEntityService: SelectEntityService) {}

  @Post('select-entity')
  public async SelectEntity(@Body() data: Select_EntityDTO) {
    await this.selectEntityService.execute({
      login_token: data.login_token,
      entity_id: data.entity_id,
    });
  }
}
