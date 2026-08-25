import { Address } from '@modules/auth/address/shared/models/address';
import { IAddressRepository } from '@modules/auth/address/shared/repositories/abstract_class/iaddress-repository';
import { Entity } from '@modules/auth/entity/shared/models/entity';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Identity_Credential } from '@modules/auth/identity_credential/shared/models/identity_credential';
import { IIdentityCredentialRepository } from '@modules/auth/identity_credential/shared/repositories/abstract_class/iidentitycredential-repository';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { Entity_Membership } from '@modules/business/entity_membership/shared/models/entity_membership';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { AppError } from '@modules/utils/app_error';
import { EntityStatus, IdentityStatus, MemberRole } from '@modules/utils/enum';
import { userPasswordValidator } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

interface ISignUpRequest {
  name: string;
  email: string;
  password: string;
  birth_date: string;
  phone: string;
  photo: string;
  entity_name: string;
  entity_type: string;
  document: string;
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  country: string;
}
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEmailService } from 'infra/email/abstract class/IEmailService';
import { IGeocodingService } from 'infra/geolocalization/interface/IGeocoding.service';

@Injectable()
export class SignUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly identity_credential_repository: IIdentityCredentialRepository,
    private readonly email_service: IEmailService,
    private readonly address_repository: IAddressRepository,
    private readonly geocoding_service: IGeocodingService,
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
    zip_code,
    street,
    number,
    neighborhood,
    city,
    state,
    complement,
    country,
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
      status: EntityStatus.PENDENTE,
      document,
      email,
      phone,
      photo,
    });
    const identity = new Identity({
      email,
      mfa_required: false,
      status: IdentityStatus.ATIVO,
    });
    const identity_credential = new Identity_Credential({
      identity_id: identity.id,
      provider: 'local',
      password_hash: password_hash,
    });
    const profile = new Profile({
      identity_id: identity.id,
      name: name,
      birth_date: new Date(birth_date),
      phone: phone,
      photo: photo,
    });
    const membership = new Entity_Membership({
      entity_id: entity._id,
      profile_id: profile.id,
      roles: [MemberRole.ADMINISTRADOR],
      status: 'ATIVO',
    });
    const geolocalization = await this.geocoding_service.geocode({
      city,
      country,
      number,
      state,
      street,
      zip_code,
    });
    const address = new Address({
      city: city,
      country: country,
      entity_id: entity._id,
      latitude: geolocalization.latitude,
      longitude: geolocalization.longitude,
      neighborhood: neighborhood,
      number: number,
      state: state,
      street: street,
      zip_code: zip_code,
      complement: complement ?? null,
    });
    const prisma = this.prisma.getPrismaClient();
    try {
      await prisma.$transaction(async (tx) => {
        await this.entity_repository.create(entity, tx);
        await this.address_repository.create(address, tx);
        await this.identity_repository.create(identity, tx);
        await this.identity_credential_repository.create(
          identity_credential,
          tx,
        );
        await this.profile_repository.create(profile, tx);
        await this.entity_membership_repository.create(membership, tx);
      });
    } catch (error) {
      throw new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        500,
      );
    }
    this.email_service
      .send({
        to: identity.email,
        subject: 'Bem-vindo! Seu cadastro foi realizado com sucesso',
        html: ` <!DOCTYPE html> <html lang="pt-BR"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>Cadastro realizado com sucesso</title> </head> <body style=" margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; color: #18181b; " > <div style=" max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); " > <!-- Header --> <div style=" background-color: #18181b; padding: 32px; text-align: center; " > <h1 style=" margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; " > Bem-vindo! 👋 </h1> <p style=" margin: 10px 0 0; color: #d4d4d8; font-size: 15px; " > Seu cadastro foi realizado com sucesso. </p> </div> <!-- Content --> <div style="padding: 40px 32px;"> <p style=" margin: 0 0 20px; font-size: 18px; line-height: 1.6; " > Olá, <strong>${name}</strong>! </p> <p style=" margin: 0 0 20px; color: #52525b; font-size: 15px; line-height: 1.7; " > É um prazer ter você conosco. Sua conta foi criada com sucesso e já estamos agilizando para que você use a sua conta. </p> <!-- Account information --> <div style=" background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin: 24px 0; " > <p style=" margin: 0 0 12px; font-size: 14px; color: #71717a; " > <strong style="color: #18181b;"> Dados do cadastro </strong> </p> <p style=" margin: 6px 0; font-size: 14px; color: #52525b; " > <strong>Nome:</strong> ${name} </p> <p style=" margin: 6px 0; font-size: 14px; color: #52525b; " > <strong>E-mail:</strong> ${email} </p> <p style=" margin: 6px 0; font-size: 14px; color: #52525b; " > <strong>Empresa:</strong> ${entity_name} </p> </div> <p style=" margin: 0 0 20px; color: #52525b; font-size: 15px; line-height: 1.7; " > Sua conta foi criada com o perfil de <strong>Administrador</strong> da empresa <strong>${entity_name}</strong>. </p> <p style=" margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.7; " > A partir de agora, você poderá configurar sua empresa, gerenciar sua equipe, organizar seus serviços e administrar seus clientes através da plataforma. </p> <!-- CTA --> <div style="text-align: center; margin: 32px 0;"> <a href="${process.env.FRONTEND_LOCAL_BARBESHOP}/signin" style=" display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; " > Acessar minha conta </a> </div> <p style=" margin: 0; color: #71717a; font-size: 13px; line-height: 1.6; " > Se você não realizou este cadastro, recomendamos que entre em contato com nossa equipe de suporte imediatamente. </p> </div> <!-- Footer --> <div style=" border-top: 1px solid #e4e4e7; padding: 24px 32px; text-align: center; " > <p style=" margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; " > Este é um e-mail automático. Por favor, não responda a esta mensagem. </p> <p style=" margin: 8px 0 0; color: #a1a1aa; font-size: 12px; " > © ${new Date().getFullYear()} Sua Plataforma. Todos os direitos reservados. </p> </div> </div> </body> </html> `,
      })
      .catch((error) => {
        console.error('Erro ao enviar e-mail:', error);
      });
    return 'Usuário cadastrado com sucesso';
  }
}
