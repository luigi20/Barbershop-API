import { AppError } from '@modules/utils/app_error';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import argon2 from 'argon2';
import { MeProfileService } from '../service/me_profile.service';

describe('Test in route Me Profile', () => {
  let profile_repository: InMemoryProfileRepository;
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    profile_repository = new InMemoryProfileRepository();
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
  });

  it('should not get profile, because identity not exists', async () => {
    const me_profile_service = new MeProfileService(profile_repository, identity_repository);
    expect(
      me_profile_service.execute({
        context_id: 'academia',
        entity_id: '1',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 404));
  });

  it('should not get profile, because profile not exists', async () => {
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
      const me_profile_service = new MeProfileService(
        profile_repository,
        identity_repository,
      );
      expect(
        me_profile_service.execute({
          context_id: 'academia',
          entity_id: entity_repository.list_entity[0]._id,
        }),
      ).rejects.toThrow(new AppError('Perfil não existe', 404));
    });

  it('should get profile', async () => {
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
    const change_profile_service = new MeProfileService(
      profile_repository,
      identity_repository,
    );
    const result = await change_profile_service.execute({
      context_id: 'academia',
      entity_id: entity_repository.list_entity[0]._id,
    });
    expect(result).toEqual(profile_repository.list_profile[0]);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
