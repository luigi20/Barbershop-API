import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Entity_Membership } from '@modules/auth/entity_membership/shared/models/entity_membership';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { EntityStatus, IdentityStatus, MemberRole } from '@modules/utils/enum';
import { userPasswordValidator } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

interface ISignUpRequest {
  name: string;
  email: string;
  password: string;
  birth_date: Date;
  phone: string;
  photo: string;
  entity_name: string;
  entity_type: string;
  document: string;
}
import { PrismaService } from 'infra/database/prisma/prisma.service';

@Injectable()
export class SignUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly membership_repository: IEntityMembershipRepository,
  ) {}

  public async execute({
    name,
    email,
    password,
    entity_name,
    phone,
    photo,
    birth_date,
    entity_type,
    document,
  }: ISignUpRequest): Promise<string> {
    // 1. Validações e regras de negócio prévias (Fora da transação)
    const password_validator = userPasswordValidator();
    const errors = password_validator.validate(password, { list: true });
    if (Array.isArray(errors) && errors.length > 0)
      throw new AppError('Senha inválida', 400);
    const identity_exists = await this.identity_repository.find_by_email(email);
    if (identity_exists)
      throw new AppError('Usuário já cadastrado no sistema', 400);
    const password_hash = await argon2.hash(password);
    // 2. Instanciação dos objetos de Domínio (Fora da transação)
    const entity = new Entity({
      name: entity_name,
      type: entity_type,
      status: EntityStatus.ATIVO,
      document,
      email,
      phone,
      photo,
    });
    const identity = new Identity({
      email,
      password_hash,
      mfa_required: false,
      provider: 'local',
      status: IdentityStatus.ATIVO,
    });
    const profile = new Profile({
      identity_id: identity.id,
      name,
      birth_date,
      phone: phone,
      photo: photo,
    });
    const membership = new Entity_Membership({
      entity_id: entity._id,
      profile_id: profile.id,
      role: MemberRole.DONO,
      status: 'ATIVO',
    });
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.entity_repository.create(entity, tx);
        await this.identity_repository.create(identity, tx);
        await this.profile_repository.create(profile, tx);
        await this.membership_repository.create(membership, tx);
      });
    } catch (error) {
      throw new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        500,
      );
    }
    return 'Usuário cadastrado com sucesso';
  }
}
