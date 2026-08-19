import { InMemoryPlanRepository } from '@modules/business/plan/shared/repositories/test/in-memory-plan-repository';
import { AppError } from '@modules/utils/app_error';
import { makePlan } from '@modules/business/plan/shared/models/test/plan-factory';
import { EntityGetOneService } from '../service/entity_get_one.service';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
jest.mock('argon2');
describe('Test in route get one entity', () => {
  let entity_repository: InMemoryEntityRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
  });
  it(`should not add entity, because entity don't exists`, async () => {
    const entity_service = new EntityGetOneService(entity_repository);
    expect(
      entity_service.execute({
        id: '123',
      }),
    ).rejects.toThrow(new AppError('Empresa não existe', 404));
  });

  it('should get one entity', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          name: 'free',
        },
      }),
    );
    entity_repository.list_entity.push(
      makeEntity({
        id: '1234',
        props: {
          name: 'free2',
        },
      }),
    );
    entity_repository.list_entity.push(
      makeEntity({
        id: '1235',
        props: {
          name: 'free3',
        },
      }),
    );
    const entity_service = new EntityGetOneService(entity_repository);
    const result = await entity_service.execute({
      id: '1235',
    });
    expect(result.name).toBe('free3');
  });
});
