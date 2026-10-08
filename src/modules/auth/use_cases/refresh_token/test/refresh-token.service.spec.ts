import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { SignInService } from '../../signin/service/signin.service';
import { SelectEntityService } from '../../select_entity/service/select_entity.service';
import { RefreshTokenService } from '../service/refresh-token.service';
import { LogoutService } from '../../logout/service/logout.service';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { InMemoryCustomerRepository } from '@modules/business/customer/shared/repositories/test/in-memory-customer-repository';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { InMemoryIdentityCredentialRepository } from '@modules/auth/identity_credential/shared/repositories/test/in-memory-identity-credential-repository';
import { Identity_Credential } from '@modules/auth/identity_credential/shared/models/identity_credential';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';

describe('Local session lifecycle', () => {
  const jwt = new JwtService({ secret: 'p0-test-only-secret' });
  const identities = new InMemoryIdentityRepository();
  const profiles = new InMemoryProfileRepository();
  const entities = new InMemoryEntityRepository();
  const memberships = new InMemoryEntityMembershipRepository();
  const links = new InMemoryEntityCustomerRepository();
  const customers = new InMemoryCustomerRepository();
  const sessions = new InMemoryRefreshTokensRepository();
  const credentials = new InMemoryIdentityCredentialRepository();
  const identity = makeIdentity({
    id: 'identity-a',
    props: { email: 'owner@example.com', status: 'ativo' },
  });
  const profile = makeProfile({
    id: 'profile-a',
    props: { identity_id: identity.id },
  });
  const entity = makeEntity({ id: 'entity-a', props: { status: 'ativo' } });
  const signin = new SignInService(
    links,
    identities,
    profiles,
    memberships,
    jwt,
    credentials,
    customers,
  );
  const select = new SelectEntityService(
    identities,
    profiles,
    memberships,
    links,
    sessions,
    jwt,
    customers,
    entities,
  );
  const refresh = new RefreshTokenService(
    jwt,
    identities,
    profiles,
    links,
    memberships,
    customers,
    sessions,
    entities,
  );
  const logout = new LogoutService(sessions, jwt);

  beforeAll(async () => {
    identities.list_identity.push(identity);
    profiles.list_profile.push(profile);
    entities.list_entity.push(entity);
    memberships.list_membership.push(
      makeEntityMembership({
        props: {
          entity_id: entity._id,
          profile_id: profile.id,
          roles: ['administrador'],
          status: 'ativo',
        },
      }),
    );
    credentials.list_identity_credential.push(
      new Identity_Credential({
        identity_id: identity.id,
        provider: 'local',
        password_hash: await argon2.hash('ValidPassword123!'),
      }),
    );
  });

  async function login() {
    const challenge = await signin.execute({
      email: identity.email,
      password: 'ValidPassword123!',
    });
    return select.execute({
      login_token: challenge.login_token,
      entity_id: entity._id,
    });
  }

  it('signs in, rotates refresh, and rejects the consumed token', async () => {
    const first = await login();
    const rotated = await refresh.execute(first.refresh_token);
    expect(rotated.access_token).toBeTruthy();
    expect(rotated.refresh_token).not.toBe(first.refresh_token);
    await expect(refresh.execute(first.refresh_token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rejects the same refresh after logout', async () => {
    const tokens = await login();
    await logout.execute(tokens.refresh_token, identity.id);
    await expect(refresh.execute(tokens.refresh_token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rejects refresh when identity becomes inactive', async () => {
    const tokens = await login();
    identity.status = 'inativo';
    try {
      await expect(refresh.execute(tokens.refresh_token)).rejects.toMatchObject(
        { statusCode: 401 },
      );
    } finally {
      identity.status = 'ativo';
    }
  });

  it('cannot log out another identity session', async () => {
    const tokens = await login();
    await expect(
      logout.execute(tokens.refresh_token, 'identity-b'),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(
      (await refresh.execute(tokens.refresh_token)).access_token,
    ).toBeTruthy();
  });
});
