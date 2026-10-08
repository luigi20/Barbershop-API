import { EntityMembershipUpdateService } from '../services/entity_membership_update.service';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { MemberRole } from '@modules/utils/enum';

describe('Membership update stays local to the entity', () => {
  const entityId = 'entity-a';
  const identityId = 'identity-a';
  const profile = makeProfile({
    id: 'profile-a',
    props: { identity_id: identityId },
  });
  const identity = makeIdentity({ id: identityId });

  function setup(currentRoles: string[] = ['barbeiro']) {
    const membership = makeEntityMembership({
      props: {
        entity_id: entityId,
        profile_id: profile.id,
        roles: currentRoles,
      },
    });
    const membershipRepo = {
      find_one: jest.fn().mockResolvedValue(membership),
      update: jest.fn(),
    };
    const profileRepo = {
      find_identity_id: jest.fn().mockResolvedValue(profile),
      update: jest.fn(),
    };
    const identityRepo = {
      find_by_id: jest.fn().mockResolvedValue(identity),
      update: jest.fn(),
    };
    const entityRepo = {
      findByIdSelectIdAndName: jest
        .fn()
        .mockResolvedValue({ id: entityId, name: 'A' }),
    };
    const prisma = {
      getPrismaClient: () => ({
        $transaction: async (fn: (tx: object) => Promise<void>) => fn({}),
      }),
    };
    const service = new EntityMembershipUpdateService(
      membershipRepo as any,
      profileRepo as any,
      entityRepo as any,
      identityRepo as any,
      prisma as any,
    );
    return { service, membershipRepo, profileRepo, identityRepo };
  }

  it('allows an administrator to update only a local membership', async () => {
    const { service, membershipRepo, profileRepo, identityRepo } = setup();
    await service.execute({
      entity_id: entityId,
      identity_id: identityId,
      roles: ['recepcionista'],
      status: 'inativo',
      roles_auth: [MemberRole.ADMINISTRADOR],
    });
    expect(membershipRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: entityId, profile_id: profile.id }),
      expect.anything(),
    );
    expect(identityRepo.update).not.toHaveBeenCalled();
    expect(profileRepo.update).not.toHaveBeenCalled();
  });

  it('prevents a receptionist from promoting anyone to administrator', async () => {
    const { service, membershipRepo } = setup();
    await expect(
      service.execute({
        entity_id: entityId,
        identity_id: identityId,
        roles: ['administrador'],
        status: 'ativo',
        roles_auth: [MemberRole.RECEPCIONISTA],
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(membershipRepo.update).not.toHaveBeenCalled();
  });

  it('prevents a receptionist from editing an existing administrator', async () => {
    const { service, membershipRepo } = setup(['administrador']);
    await expect(
      service.execute({
        entity_id: entityId,
        identity_id: identityId,
        roles: ['barbeiro'],
        status: 'inativo',
        roles_auth: [MemberRole.RECEPCIONISTA],
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(membershipRepo.update).not.toHaveBeenCalled();
  });
});
