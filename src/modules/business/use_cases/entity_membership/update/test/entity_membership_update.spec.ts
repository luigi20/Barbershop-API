import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { AppError } from '@modules/utils/app_error';
import { InMemoryEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { EntityMembershipUpdateService } from '../services/entity_membership_update.service';

jest.mock('argon2');
describe('Test in route update membership', () => {
  let entity_repository: InMemoryEntityRepository;
  let profile_repository: InMemoryProfileRepository;
  let identity_repository: InMemoryIdentityRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  const prismaMock = {
    getPrismaClient: jest.fn(),
    $transaction: jest.fn(async (callback) => {
      return callback(prismaMock);
    }),
  } as unknown as PrismaService;
  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    profile_repository = new InMemoryProfileRepository();
    entity_membership_repository = new InMemoryEntityMembershipRepository();
    identity_repository = new InMemoryIdentityRepository();
  });

  it('should not update member, because tenant not exists', async () => {
    const entityMembershipUpdateService = new EntityMembershipUpdateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipUpdateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: randomUUID(),
        mfa_required: false,
        name: 'Luis',
        status: 'ativo',
        phone: '55793843738',
        photo: null,
        roles: ['barbeiro'],
      }),
    ).rejects.toThrow(new AppError('Empresa não existe', 404));
  });

  it('should not update member, because credentials invalid', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    const entityMembershipUpdateService = new EntityMembershipUpdateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipUpdateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: '123',
        mfa_required: false,
        name: 'Luis',
        status: 'ativo',
        phone: '55793843738',
        photo: null,
        roles: ['barbeiro'],
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should not update member, because profile not exists', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'l@gmail.com',
        },
      }),
    );
    const entityMembershipUpdateService = new EntityMembershipUpdateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipUpdateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: '123',
        mfa_required: false,
        name: 'Luis',
        status: 'ativo',
        phone: '55793843738',
        photo: null,
        roles: ['barbeiro'],
      }),
    ).rejects.toThrow(new AppError('Perfil não existe', 404));
  });

  it('should not update member, because membership not exists', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'l@gmail.com',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    const entityMembershipUpdateService = new EntityMembershipUpdateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipUpdateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: '123',
        mfa_required: false,
        name: 'Luis',
        status: 'ativo',
        phone: '55793843738',
        photo: null,
        roles: ['barbeiro'],
      }),
    ).rejects.toThrow(
      new AppError('Usuário não pertence a essa organização', 404),
    );
  });

  it('should not update member, because transaction failed', async () => {
    const prismaMock = {
      getPrismaClient: jest.fn(),
      $transaction: jest.fn().mockRejectedValue(new Error('Erro na transação')),
    } as unknown as PrismaService;
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'l@gmail.com',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        props: {
          profile_id: '123',
          entity_id: '123',
        },
      }),
    );
    const entityMembershipUpdateService = new EntityMembershipUpdateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipUpdateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: '123',
        mfa_required: false,
        name: 'Luis',
        status: 'ativo',
        phone: '55793843738',
        photo: null,
        roles: ['recepcionista'],
      }),
    ).rejects.toThrow(
      new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        400,
      ),
    );
  });

  it('should update member', async () => {
    const prismaMock = {
      getPrismaClient: jest.fn(),
      $transaction: jest.fn(),
    } as unknown as PrismaService;
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'l@gmail.com',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        props: {
          profile_id: '123',
          entity_id: '123',
        },
      }),
    );
    const entityMembershipUpdateService = new EntityMembershipUpdateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    const result = await entityMembershipUpdateService.execute({
      birth_date: new Date(),
      email: 'l@gmail.com',
      entity_id: '123',
      mfa_required: false,
      name: 'Luis',
      phone: '55793843738',
      photo: null,
      roles: ['recepcionista'],
      status: 'inativo',
    });
    expect(result).not.toBe(null);
    expect(result.status).toEqual('inativo');
    expect(identity_repository.list_identity.length).toEqual(1);
    expect(profile_repository.list_profile.length).toEqual(1);
    expect(entity_membership_repository.list_membership.length).toEqual(1);
  });
  /*
  it('should not create member, because password is invalid', async () => {
    const entityMembershipCreateService = new EntityMembershipCreateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipCreateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: randomUUID(),
        mfa_required: false,
        name: 'Luis',
        password: '1',
        phone: '55793843738',
        photo: null,
        roles: ['barbeiro'],
      }),
    ).rejects.toThrow(new AppError('Senha inválida', 400));
  });

  it('should not create member, because transaction failed', async () => {
    const prismaMock = {
      getPrismaClient: jest.fn(),
      $transaction: jest.fn().mockRejectedValue(new Error('Erro na transação')),
    } as unknown as PrismaService;
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    const entityMembershipCreateService = new EntityMembershipCreateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    expect(
      entityMembershipCreateService.execute({
        birth_date: new Date(),
        email: 'l@gmail.com',
        entity_id: '123',
        mfa_required: false,
        name: 'Luis',
        password: 'scsLCDCJDVDJ#4324343435',
        phone: '55793843738',
        photo: null,
        roles: ['barbeiro'],
      }),
    ).rejects.toThrow(
      new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        400,
      ),
    );
  });

  it('should create identity, profile and member', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    const entityMembershipCreateService = new EntityMembershipCreateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    const result = await entityMembershipCreateService.execute({
      birth_date: new Date(),
      email: 'l@gmail.com',
      entity_id: '123',
      mfa_required: false,
      name: 'Luis',
      password: 'scsLCDCJDVDJ#4324343435',
      phone: '55793843738',
      photo: null,
      roles: ['barbeiro'],
    });
    expect(result).not.toBe(null);
    expect(identity_repository.list_identity.length).toEqual(1);
    expect(profile_repository.list_profile.length).toEqual(1);
    expect(entity_membership_repository.list_membership.length).toEqual(1);
  });

  it('should member', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'l@gmail.com',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    const entityMembershipCreateService = new EntityMembershipCreateService(
      entity_membership_repository,
      profile_repository,
      entity_repository,
      identity_repository,
      prismaMock,
    );
    const result = await entityMembershipCreateService.execute({
      birth_date: new Date(),
      email: 'l@gmail.com',
      entity_id: '123',
      mfa_required: false,
      name: 'Luis',
      password: 'scsLCDCJDVDJ#4324343435',
      phone: '55793843738',
      photo: null,
      roles: ['recepcionista'],
    });
    expect(result).not.toBe(null);
    expect(identity_repository.list_identity.length).toEqual(1);
    expect(profile_repository.list_profile.length).toEqual(1);
    expect(entity_membership_repository.list_membership.length).toEqual(1);
  });*/
});
