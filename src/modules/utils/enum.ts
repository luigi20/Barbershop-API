export enum EntityType {
  BARBEARIA = 'barbearia',
  STUDIO = 'studio',
}

export enum EntityStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  BLOQUEADO = 'bloqueado',
  PENDENTE = 'pendente',
}

export enum CustomerStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  BLOQUEADO = 'bloqueado',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  APPLE = 'apple',
}

export enum IdentityStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  BLOQUEADO = 'bloqueado',
}

export enum MemberRole {
  DONO = 'dono',
  ADMINISTRADOR = 'administrador',
  BARBEIRO = 'barbeiro',
  RECEPCIONISTA = 'recepcionista',
  CLIENTE = 'cliente',
}

export enum MembershipStatus {
  ATIVO = 'ativo',
  CONVIDADO = 'convidado',
  INATIVO = 'inativo',
}

export enum TokenType {
  LOGIN = 'login_token',
  MFA = 'mfa_token',
  ACCESS = 'access_token',
  CHALLENGE = 'challenge',
  REFRESH = 'refresh',
}
