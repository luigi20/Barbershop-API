import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { SignUpService } from '../service/signup.service';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';

describe('Test in route signup', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let profile_repository: InMemoryProfileRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  const prismaMock = {
    getPrismaClient: jest.fn(),
    $transaction: jest.fn(async (callback) => {
      return callback(prismaMock);
    }),
  } as unknown as PrismaService;
  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    profile_repository = new InMemoryProfileRepository();
    entity_membership_repository = new InMemoryEntityMembershipRepository();
  });

  it('should not add signup, because password is invalid', async () => {
    const signUpService = new SignUpService(
      prismaMock,
      entity_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
    );
    expect(
      signUpService.execute({
        birth_date: new Date(),
        entity_name: 'Brutal',
        entity_type: 'BARBEARIA',
        phone: '5511960592354',
        email: 'luisfoco@gmail.com',
        password: '1',
        name: 'Luis',
        photo: null,
        document: '2324242',
      }),
    ).rejects.toThrow(new AppError('Senha inválida', 400));
  });

  it('should not add signup, because the identity is already registered in the system.', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    const signUpService = new SignUpService(
      prismaMock,
      entity_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
    );
    expect(
      signUpService.execute({
        email: 'luisfoco@gmail.com',
        password: 'scsLCDCJDVDJ#4324343435',
        name: 'Luis',
        birth_date: new Date(),
        document: '343434',
        entity_name: '',
        entity_type: 'barbershop',
        phone: '3224343434',
        photo: null,
      }),
    ).rejects.toThrow(new AppError('Usuário já cadastrado no sistema', 400));
  });

  it('should not add signup, because transaction failed', async () => {
    const signUpService = new SignUpService(
      prismaMock,
      entity_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
    );
    expect(
      signUpService.execute({
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        password: 'fdlmflk45454ÇFFGÇ!',
        birth_date: new Date(),
        document: '343434',
        entity_name: '',
        entity_type: 'barbershop',
        phone: '3224343434',
        photo: null,
      }),
    ).rejects.toThrow(
      new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        400,
      ),
    );
  });

  it('should add signup', async () => {
    const signUpService = new SignUpService(
      prismaMock,
      entity_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
    );
    const msg = await signUpService.execute({
      email: 'luisfoco@gmail.com',
      name: 'Luis',
      password: 'fdlmflk45454ÇFFGÇ!',
      birth_date: new Date(),
      document: '343434',
      entity_name: '',
      entity_type: 'barbershop',
      phone: '3224343434',
      photo: null,
    });
    expect(msg).toBe('Usuário cadastrado com sucesso');
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
