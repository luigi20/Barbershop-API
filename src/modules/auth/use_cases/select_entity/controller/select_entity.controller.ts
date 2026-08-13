import { Body, Controller, Post } from '@nestjs/common';
import { SelectEntityService } from '../service/select_entity.service';
import { Select_EntityDTO } from '../dto/select_entityDTO';

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
