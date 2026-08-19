import { InMemoryPlanRepository } from '@modules/business/plan/shared/repositories/test/in-memory-plan-repository';
import { EntityUpdateService } from '../service/entity_update.service';
import { AppError } from '@modules/utils/app_error';
import { makePlan } from '@modules/business/plan/shared/models/test/plan-factory';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';

jest.mock('argon2');
describe('Test in route update entity', () => {
  let entity_repository: InMemoryEntityRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
  });
  it(`should not update entity, because entity don't exists`, async () => {
    entity_repository.list_entity.push(makeEntity());
    const entity_service = new EntityUpdateService(entity_repository);
    expect(
      entity_service.execute({
        name: 'free',
        document: '23224',
        email: 'rert4t4',
        phone: '324242',
        photo: null,
        status: 'ativo',
        type: 'barbearia',
        id: '123',
      }),
    ).rejects.toThrow(new AppError('Empresa não existe', 404));
  });

  it('should update entity', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          name: 'free',
          status: 'ativo',
        },
      }),
    );
    const entity_service = new EntityUpdateService(entity_repository);
    const result = await entity_service.execute({
      name: 'free',
      document: '23224',
      email: 'rert4t4',
      phone: '324242',
      photo: null,
      status: 'inativo',
      type: 'barbearia',
      id: '123',
    });
    expect(result.name).toEqual('free');
    expect(result.status).toEqual('inativo');
    expect(entity_repository.list_entity).toHaveLength(1);
  });
});
