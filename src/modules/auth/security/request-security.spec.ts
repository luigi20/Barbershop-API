import {
  bearerToken,
  matchingToken,
  tenantId,
  assertMemberRoles,
} from './request-security';
import { MemberRole } from '@modules/utils/enum';
import { EntityMembershipCreateController } from '@modules/business/use_cases/entity_membership/create/controller/entity_membership_create.controller';
import { EntityMembershipCreateService } from '@modules/business/use_cases/entity_membership/create/services/entity_membership_create.service';
import { EntityMembershipUpdateController } from '@modules/business/use_cases/entity_membership/update/controller/entity_membership_update.controller';
import { EntityCustomerCreateController } from '@modules/business/use_cases/entity_customer/create/controller/entity_customer_create.controller';
import { EntityCustomerUpdateController } from '@modules/business/use_cases/entity_customer/update/controller/entity_customer_update.controller';
import { EntityGetOneController } from '@modules/business/use_cases/entity/get_one/controller/entity_get_one.controller';
import { EntityUpdateController } from '@modules/business/use_cases/entity/update/controller/entity_update.controller';
import { SubscriptionCreateController } from '@modules/business/use_cases/subscription/create/controller/subscription_create.controller';
import { SubscriptionGetOneController } from '@modules/business/use_cases/subscription/get_one/controller/subscription_get_one.controller';
import { SubscriptionUpdateController } from '@modules/business/use_cases/subscription/update/controller/subscription_update.controller';
import { AuthGuardAccess } from '@modules/auth/guards/auth_guard_access';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '@modules/utils/types/types';

describe('Request tenant authority and RBAC', () => {
  const req = {
    auth: {
      entity_id: 'entity-a',
      identity_id: 'identity-a',
      profile_id: 'profile-a',
      roles: [MemberRole.ADMINISTRADOR],
      is_superuser: false,
    },
  } as AuthRequest;
  const other = { ...req, auth: { ...req.auth, is_superuser: true } };

  it('rejects a different tenant even for a superuser without route-specific authorization', () => {
    expect(() => tenantId(req.auth, 'entity-b')).toThrow();
    expect(() => tenantId(other.auth, 'entity-b')).toThrow();
    expect(tenantId(req.auth, 'entity-a')).toBe('entity-a');
  });

  it('rejects member creation in another tenant before calling the service', async () => {
    const service = { execute: jest.fn() };
    const controller = new EntityMembershipCreateController(service as any);
    await expect(
      controller.Members(req, { entity_id: 'entity-b' } as any),
    ).rejects.toMatchObject({ status: 403 });
    expect(service.execute).not.toHaveBeenCalled();
  });

  it('rejects membership update in another tenant', async () => {
    const service = { execute: jest.fn() };
    await expect(
      new EntityMembershipUpdateController(service as any).Members(
        { entity_id: 'entity-b' } as any,
        req,
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(service.execute).not.toHaveBeenCalled();
  });

  it('rejects customer create and update in another tenant', async () => {
    const create = { execute: jest.fn() };
    const update = { execute: jest.fn() };
    await expect(
      new EntityCustomerCreateController(create as any).Members(req, {
        entity_id: 'entity-b',
      } as any),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      new EntityCustomerUpdateController(update as any).Members(req, {
        entity_id: 'entity-b',
      } as any),
    ).rejects.toMatchObject({ status: 403 });
    expect(create.execute).not.toHaveBeenCalled();
    expect(update.execute).not.toHaveBeenCalled();
  });

  it('rejects entity read and update in another tenant', async () => {
    const read = { execute: jest.fn() };
    const update = { execute: jest.fn() };
    await expect(
      new EntityGetOneController(read as any).EntityGetOne(req, 'entity-b'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      new EntityUpdateController(update as any).EntityUpdate(
        req,
        {} as any,
        'entity-b',
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(read.execute).not.toHaveBeenCalled();
    expect(update.execute).not.toHaveBeenCalled();
  });

  it('rejects receptionist creation or promotion of an administrator', () => {
    expect(() =>
      assertMemberRoles([MemberRole.RECEPCIONISTA], ['administrador']),
    ).toThrow();
    expect(() =>
      assertMemberRoles(
        [MemberRole.RECEPCIONISTA],
        ['barbeiro'],
        ['administrador'],
      ),
    ).toThrow();
    expect(() =>
      assertMemberRoles([MemberRole.RECEPCIONISTA], ['invalid']),
    ).toThrow();
  });

  it('rejects receptionist admin creation before any repository write', async () => {
    const service = new EntityMembershipCreateService(
      { create: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      service.execute({
        entity_id: 'entity-a',
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New',
        phone: '',
        photo: '',
        birth_date: '2000-01-01',
        mfa_required: false,
        roles: ['administrador'],
        roles_auth: [MemberRole.RECEPCIONISTA],
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects Subscription tenant mismatch before invoking business operations', async () => {
    const create = { execute: jest.fn() };
    const read = { execute: jest.fn() };
    const update = { execute: jest.fn() };
    await expect(
      new SubscriptionCreateController(create as any).Subscription(req, {
        entity_id: 'entity-b',
      } as any),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      new SubscriptionGetOneController(read as any).Subscription(
        req,
        'entity-b',
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      new SubscriptionUpdateController(update as any).Subscription(
        req,
        { entity_id: 'entity-b' } as any,
        'subscription-b',
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(create.execute).not.toHaveBeenCalled();
    expect(read.execute).not.toHaveBeenCalled();
    expect(update.execute).not.toHaveBeenCalled();
  });

  it('requires Bearer and matching body/header token', () => {
    expect(() => bearerToken({ headers: {} } as any)).toThrow(
      expect.objectContaining({ status: 401 }),
    );
    expect(() =>
      bearerToken({ headers: { authorization: 'Basic token' } } as any),
    ).toThrow(expect.objectContaining({ status: 401 }));
    expect(() =>
      matchingToken({ headers: { authorization: 'Bearer one' } } as any, 'two'),
    ).toThrow(expect.objectContaining({ status: 401 }));
    expect(
      matchingToken({ headers: { authorization: 'Bearer one' } } as any, 'one'),
    ).toBe('one');
  });

  it('returns 401 from the access guard when Authorization is absent', async () => {
    const request = { headers: {} };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    await expect(
      new AuthGuardAccess(
        new JwtService({ secret: 'p0-test-only-secret' }),
      ).canActivate(context),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('copies is_superuser from a verified access token into req.auth', async () => {
    const jwt = new JwtService({ secret: 'p0-test-only-secret' });
    const token = jwt.sign({
      sub: 'identity-a',
      profile_id: 'profile-a',
      entity_id: 'entity-a',
      type: 'access',
      roles: ['administrador'],
      is_superuser: true,
    });
    const request = {
      headers: { authorization: `Bearer ${token}` },
      auth: null,
    } as unknown as AuthRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    await new AuthGuardAccess(jwt).canActivate(context);
    expect(request.auth).toMatchObject({
      identity_id: 'identity-a',
      entity_id: 'entity-a',
      is_superuser: true,
    });
  });
});
