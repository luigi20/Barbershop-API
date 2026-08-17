import { InMemoryPlanRepository } from '@modules/business/plan/shared/repositories/test/in-memory-plan-repository';
import { AppError } from '@modules/utils/app_error';
import { makePlan } from '@modules/business/plan/shared/models/test/plan-factory';
import { PlanGetAllService } from '../service/plan_get_all.service';

jest.mock('argon2');
describe('Test in route get all plan', () => {
  let plan_repository: InMemoryPlanRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    plan_repository = new InMemoryPlanRepository();
  });
  /*  it(`should not add plan, because plan don't exists`, async () => {
    plan_repository.list_plan.push(makePlan());
    const plan_service = new PlanUpdateService(plan_repository);
    expect(
      plan_service.execute({
        name: 'free',
        active: true,
        description: 'fdsfs',
        max_appointments: 0,
        max_customers: 0,
        max_members: 0,
        price: 0,
        id: '123',
      }),
    ).rejects.toThrow(new AppError('Plano não existe', 404));
  });

  it(`should not add plan, because plan name exists`, async () => {
    plan_repository.list_plan.push(
      makePlan({
        id: '123',
        props: {
          name: 'free',
        },
      }),
    );
    plan_repository.list_plan.push(
      makePlan({
        id: '1237',
        props: {
          name: 'free2',
        },
      }),
    );
    const plan_service = new PlanUpdateService(plan_repository);
    expect(
      plan_service.execute({
        name: 'free2',
        active: true,
        description: 'fdsfs',
        max_appointments: 0,
        max_customers: 0,
        max_members: 0,
        price: 0,
        id: '123',
      }),
    ).rejects.toThrow(new AppError('Nome de plano já existe', 404));
  });*/

  it('should get list plan', async () => {
    plan_repository.list_plan.push(
      makePlan({
        id: '123',
        props: {
          name: 'free',
        },
      }),
    );
    plan_repository.list_plan.push(
      makePlan({
        id: '1234',
        props: {
          name: 'free2',
        },
      }),
    );
    plan_repository.list_plan.push(
      makePlan({
        id: '1235',
        props: {
          name: 'free3',
        },
      }),
    );
    const plan_service = new PlanGetAllService(plan_repository);
    const result = await plan_service.execute();
    expect(result).toHaveLength(3);
  });
});
