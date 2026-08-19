import { InMemoryPlanRepository } from '@modules/business/plan/shared/repositories/test/in-memory-plan-repository';
import { AppError } from '@modules/utils/app_error';
import { makePlan } from '@modules/business/plan/shared/models/test/plan-factory';
import { EntityGetAllService } from '../service/entity_get_all.service';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';

jest.mock('argon2');
describe('Test in route get all entity', () => {
  let entityRepository: InMemoryEntityRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    entityRepository = new InMemoryEntityRepository();
  });

  it('should get list plan', async () => {
    entityRepository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          name: 'free',
        },
      }),
    );
    entityRepository.list_entity.push(
      makeEntity({
        id: '1234',
        props: {
          name: 'free2',
        },
      }),
    );
    entityRepository.list_entity.push(
      makeEntity({
        id: '1235',
        props: {
          name: 'free3',
        },
      }),
    );
    const entity_service = new EntityGetAllService(entityRepository);
    const result = await entity_service.execute();
    expect(result).toHaveLength(3);
  });
});
