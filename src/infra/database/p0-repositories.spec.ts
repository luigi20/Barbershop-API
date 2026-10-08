import { ProfileRepository } from '@modules/auth/profile/shared/repositories/profile-repository';
import { CustomerRepository } from '@modules/business/customer/shared/repositories/customer-repository';
import { EntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/entitymembership-repository';
import { IdentityRepository } from '@modules/auth/identity/shared/repositories/identity-repository';
import { IdentityCredentialRepository } from '@modules/auth/identity_credential/shared/repositories/identity-credential-repository';
import { CustomerMapper } from './mappers/CustomerMapper';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeCustomer } from '@modules/business/customer/shared/models/test/customer-factory';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { Identity_Credential } from '@modules/auth/identity_credential/shared/models/identity_credential';

describe('P0 Prisma repository delegates', () => {
  const profile = makeProfile({
    id: 'profile-a',
    props: { identity_id: 'identity-a' },
  });
  const customer = makeCustomer({
    id: 'customer-a',
    props: { profile_id: profile.id },
  });
  const membership = makeEntityMembership({
    props: { entity_id: 'entity-a', profile_id: profile.id },
  });

  it('updates Profile delegate and preserves its identity and creation timestamp', async () => {
    const profileUpdate = jest.fn();
    const identityUpdate = jest.fn();
    const repository = new ProfileRepository({
      getPrismaClient: () => ({
        profile: { update: profileUpdate },
        identity: { update: identityUpdate },
      }),
    } as any);
    await repository.update(profile);
    expect(profileUpdate).toHaveBeenCalledTimes(1);
    const profileCall = (
      profileUpdate.mock.calls as unknown as Array<
        [
          {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
          },
        ]
      >
    )[0][0];
    expect(profileCall.where).toEqual({ id: profile.id });
    expect(profileCall.data).toMatchObject({
      name: profile.name,
      phone: profile.phone,
    });
    expect(profileCall.data).not.toHaveProperty('identity_id');
    expect(profileCall.data).not.toHaveProperty('created_at');
    expect(identityUpdate).not.toHaveBeenCalled();
  });

  it('uses the transaction delegate when supplied', async () => {
    const update = jest.fn();
    const repository = new ProfileRepository({
      getPrismaClient: () => {
        throw new Error('must use tx');
      },
    } as any);
    await repository.update(profile, { profile: { update } } as any);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('preserves Customer ID in both mapper directions and handles null lookup', async () => {
    const raw = {
      id: customer._id,
      profile_id: profile.id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const domain = CustomerMapper.toDomain(raw);
    expect(domain._id).toBe(raw.id);
    expect(CustomerMapper.toPrisma(domain).id).toBe(raw.id);
    const repository = new CustomerRepository({
      getPrismaClient: () => ({
        customer: { findUnique: jest.fn().mockResolvedValue(null) },
      }),
    } as any);
    await expect(repository.find_profile_id(profile.id)).resolves.toBeNull();
  });

  it('really creates Customer through Prisma, including inside a transaction', async () => {
    const create = jest.fn();
    const update = jest.fn();
    const repository = new CustomerRepository({
      getPrismaClient: () => ({ customer: { create, update } }),
    } as any);
    await repository.create(customer);
    expect(create).toHaveBeenCalledTimes(1);
    const createCall = (
      create.mock.calls as unknown as Array<
        [
          {
            data: Record<string, unknown>;
          },
        ]
      >
    )[0][0];
    expect(createCall.data).toMatchObject({
      id: customer._id,
      profile_id: profile.id,
    });
    expect(update).not.toHaveBeenCalled();
    const txCreate = jest.fn();
    await repository.create(customer, {
      customer: { create: txCreate },
    } as any);
    expect(txCreate).toHaveBeenCalledTimes(1);
  });

  it('updates Membership by the real composite key', async () => {
    const update = jest.fn();
    const repository = new EntityMembershipRepository({
      getPrismaClient: () => ({ entityMembership: { update } }),
    } as any);
    await repository.update(membership);
    expect(update).toHaveBeenCalledTimes(1);
    const membershipCall = (
      update.mock.calls as unknown as Array<
        [
          {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
          },
        ]
      >
    )[0][0];
    expect(membershipCall.where).toEqual({
      entity_id_profile_id: {
        entity_id: membership.entity_id,
        profile_id: membership.profile_id,
      },
    });
    expect(membershipCall.data).toMatchObject({
      roles: membership.roles,
      status: membership.status,
    });
    expect(membershipCall.data).not.toHaveProperty('created_at');
  });

  it('supplies deterministic Identity and Credential selectors', async () => {
    const identityUpdate = jest.fn();
    const credentialUpdate = jest.fn();
    const client = {
      identity: { update: identityUpdate },
      identityCredential: { update: credentialUpdate },
    };
    const identity = makeIdentity({ id: 'identity-a' });
    const credential = new Identity_Credential(
      { identity_id: identity.id, provider: 'local', password_hash: 'hash' },
      'credential-a',
    );
    await new IdentityRepository({
      getPrismaClient: () => client,
    } as any).update(identity);
    await new IdentityCredentialRepository({
      getPrismaClient: () => client,
    } as any).update(credential);
    const identityCall = (
      identityUpdate.mock.calls as unknown as Array<
        [
          {
            where: Record<string, unknown>;
          },
        ]
      >
    )[0][0];
    const credentialCall = (
      credentialUpdate.mock.calls as unknown as Array<
        [
          {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
          },
        ]
      >
    )[0][0];
    expect(identityCall.where).toEqual({ id: identity.id });
    expect(credentialCall.where).toEqual({
      id: credential.id,
    });
    expect(credentialCall.data.provider).toBe('local');
  });
});
