import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { MembersService } from '../services/members.service';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';

describe('Test in route Members', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let profile_repository: InMemoryProfileRepository;

  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    profile_repository = new InMemoryProfileRepository();
  });

  it('should not get members, because count members equal 0', async () => {
    const membersService = new MembersService(
      profile_repository,
      identity_repository,
    );
    const result = await membersService.execute({
      tenant_id: 'default',
      context_id: 'academia',
    });
    expect(result.length).toBe(0);
  });

  it('should list members', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    profile_repository.list_profile.push(makeProfile());
    const members_service = new MembersService(
      profile_repository,
      identity_repository,
    );
    const result = await members_service.execute({
      tenant_id: 'default',
      context_id: 'academia',
    });
    expect(result.length).toBe(1);
  });
});
