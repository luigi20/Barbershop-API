import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { SignUpService } from '../service/signup.service';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';

describe('Test in route signup', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let profile_repository: InMemoryProfileRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    profile_repository = new InMemoryProfileRepository();
    entity_membership_repository = new InMemoryEntityMembershipRepository();
  });

  it('should not add signup, because password is invalid', async () => {
    const signUpService = new SignUpService(
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
          context_id: 'academia',
          entity_id: '123',
        },
      }),
    );
    const signUpService = new SignUpService(
      entity_repository,
      identity_repository,
      profile_repository,
    );
    expect(
      signUpService.execute({
        context_id: 'academia',
        email: 'luisfoco@gmail.com',
        password: 'scsLCDCJDVDJ#4324343435',
        name: 'Luis',
        tenant_id: 'default',
      }),
    ).rejects.toThrow(new AppError('Usuário já cadastrado no sistema', 400));
  });

  it('should add signup, even without having a registered entity', async () => {
    const signUpService = new SignUpService(
      entity_repository,
      identity_repository,
      profile_repository,
    );
    const msg = await signUpService.execute({
      context_id: 'academia',
      email: 'luisfoco@gmail.com',
      name: 'Luis',
      password: 'fdlmflk45454ÇFFGÇ!',
      tenant_id: 'default',
    });
    expect(msg).toBe('Usuário cadastrado com sucesso');
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });

  it('should add signup, even if an entity is registered.', async () => {
    entity_repository.list_entity.push(makeEntity());
    const signUpService = new SignUpService(
      entity_repository,
      identity_repository,
      profile_repository,
    );
    const msg = await signUpService.execute({
      context_id: 'academia',
      email: 'luisfoco@gmail.com',
      name: 'Luis',
      password: 'fdlmflk45454ÇFFGÇ!',
      tenant_id: 'default',
    });
    expect(msg).toBe('Usuário cadastrado com sucesso');
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
