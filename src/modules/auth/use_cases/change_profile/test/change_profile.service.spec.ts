import { AppError } from '@modules/utils/app_error';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { ChangeProfileService } from '../service/change_profile.service';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import argon2 from 'argon2';

describe('Test in route Change Profile', () => {
  let profile_repository: InMemoryProfileRepository;
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    profile_repository = new InMemoryProfileRepository();
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
  });

  it('should not change profile, because credentials not exists', async () => {
    const change_profile_service = new ChangeProfileService(
      profile_repository,
      identity_repository,
    );
    expect(
      change_profile_service.execute({
        context_id: 'academia',
        name: 'luisfoco@gmail.com',
        entity_id: '1',
        photo_url: '1232323',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 404));
  });

  it('should not change profile, because profile not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          password: await argon2.hash('123LLv!!@32mjnvhfh'),
          mfa_required: true,
        },
      }),
    );
    const change_profile_service = new ChangeProfileService(
      profile_repository,
      identity_repository,
    );
    expect(
      change_profile_service.execute({
        context_id: 'academia',
        name: 'luisfoco@gmail.com',
        entity_id: entity_repository.list_entity[0]._id,
        photo_url: '1232323',
      }),
    ).rejects.toThrow(new AppError('Perfil não existe', 404));
  });

  it('should change profile', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          password: await argon2.hash('123LLv!!@32mjnvhfh'),
          mfa_required: true,
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          context_id: 'academia',
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const change_profile_service = new ChangeProfileService(
      profile_repository,
      identity_repository,
    );
    const result = await change_profile_service.execute({
      context_id: 'academia',
      name: 'Pedro',
      entity_id: entity_repository.list_entity[0]._id,
      photo_url: '1232323',
    });
    expect(result.name).toBe('Pedro');
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
