export enum EntityType {
  BARBEARIA = 'BARBEARIA',
  STUDIO = 'STUDIO',
}

export enum EntityStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
  PENDENTE = 'PENDENTE',
}

export enum CustomerStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum IdentityStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}

export enum MemberRole {
  DONO = 'DONO',
  ADMINISTRADOR = 'ADMINISTRADOR',
  BARBEIRO = 'BARBEIRO',
  RECEPCIONISTA = 'RECEPCIONISTA',
  CLIENTE = 'CLIENTE',
}

export enum MembershipStatus {
  ATIVO = 'ATIVO',
  CONVIDADO = 'CONVIDADO',
  INATIVO = 'INATIVO',
}

export enum TokenType {
  LOGIN = 'login_token',
  MFA = 'mfa_token',
  ACCESS = 'access_token',
  CHALLENGE = 'challenge',
  REFRESH = 'refresh',
}
