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

  it('should not change profile, because profile not exists', async () => {
    const change_profile_service = new ChangeProfileService(profile_repository);
    expect(
      change_profile_service.execute({
        name: 'luisfoco@gmail.com',
        photo_url: '1232323',
        birth_date: '12/04/1990',
        phone: '6565656',
        profile_id: '123',
      }),
    ).rejects.toThrow(new AppError('Perfil não existe', 404));
  });

  it('should change profile', async () => {
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          name: 'Pedro',
        },
      }),
    );
    const change_profile_service = new ChangeProfileService(profile_repository);
    const result = await change_profile_service.execute({
      name: 'luisfoco@gmail.com',
      photo_url: '1232323',
      birth_date: '12/04/1990',
      phone: '6565656',
      profile_id: '123',
    });
    expect(result.name).toBe('luisfoco@gmail.com');
    expect(profile_repository.list_profile).toHaveLength(1);
  });
});
