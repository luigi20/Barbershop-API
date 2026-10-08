import { EntityCustomerUpdateService } from '../services/entity_customer_update.service';
import { makeEntityMembershipCustomer } from '@modules/business/entity_customer/shared/models/test/entity-customer-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeCustomer } from '@modules/business/customer/shared/models/test/customer-factory';

describe('Customer update stays local to the entity', () => {
  it('updates notes and status without changing global Identity or Profile', async () => {
    const identity = makeIdentity({
      id: 'identity-a',
      props: { email: 'customer@example.com' },
    });
    const profile = makeProfile({
      id: 'profile-a',
      props: { identity_id: identity.id },
    });
    const customer = makeCustomer({
      id: 'customer-a',
      props: { profile_id: profile.id },
    });
    const link = makeEntityMembershipCustomer({
      props: { entity_id: 'entity-a', customer_id: customer._id },
    });
    const linkRepo = {
      find_one: jest.fn().mockResolvedValue(link),
      update: jest.fn(),
    };
    const profileRepo = {
      find_one: jest.fn().mockResolvedValue(profile),
      update: jest.fn(),
    };
    const identityRepo = {
      find_by_id: jest.fn().mockResolvedValue(identity),
      update: jest.fn(),
    };
    const entityRepo = {
      findByIdSelectIdAndName: jest
        .fn()
        .mockResolvedValue({ id: 'entity-a', name: 'A' }),
    };
    const customerRepo = {
      find_one: jest.fn().mockResolvedValue(customer),
    };
    const prisma = {
      getPrismaClient: () => ({
        $transaction: async (fn: (tx: object) => Promise<void>) => fn({}),
      }),
    };
    const service = new EntityCustomerUpdateService(
      linkRepo as any,
      profileRepo as any,
      entityRepo as any,
      identityRepo as any,
      prisma as any,
      customerRepo as any,
    );
    await service.execute({
      entity_id: 'entity-a',
      customer_id: customer._id,
      notes: 'local note',
      status: 'inativo',
    });
    expect(linkRepo.find_one).toHaveBeenCalledWith('entity-a', customer._id);
    expect(linkRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: 'entity-a',
        customer_id: customer._id,
        notes: 'local note',
      }),
      expect.anything(),
    );
    expect(identityRepo.update).not.toHaveBeenCalled();
    expect(profileRepo.update).not.toHaveBeenCalled();
  });
});
