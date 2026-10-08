import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole } from '@modules/utils/enum';

export function bearerToken(request: Pick<AuthRequest, 'headers'>): string {
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? '');
  if (!match)
    throw new UnauthorizedException('Authorization Bearer obrigatório');
  return match[1];
}

export function matchingToken(
  request: Pick<AuthRequest, 'headers'>,
  bodyToken: string,
): string {
  const token = bearerToken(request);
  if (token !== bodyToken)
    throw new UnauthorizedException('Tokens do header e body devem ser iguais');
  return token;
}

export function tenantId(auth: AuthRequest['auth'], requested: string): string {
  if (!auth?.entity_id || !requested)
    throw new ForbiddenException('Contexto da empresa obrigatório');
  if (requested !== auth.entity_id)
    throw new ForbiddenException('Acesso a outra empresa não permitido');
  return auth.entity_id;
}

export function assertMemberRoles(
  actorRoles: MemberRole[],
  requested: string[],
  current: string[] = [],
): void {
  if (
    !Array.isArray(requested) ||
    requested.length === 0 ||
    requested.includes(MemberRole.CLIENTE) ||
    requested.some(
      (role) => !Object.values(MemberRole).includes(role as MemberRole),
    )
  ) {
    throw new BadRequestException('Roles inválidas');
  }
  if (actorRoles?.includes(MemberRole.ADMINISTRADOR)) return;
  if (
    !actorRoles?.includes(MemberRole.RECEPCIONISTA) ||
    requested.includes(MemberRole.ADMINISTRADOR) ||
    current.includes(MemberRole.ADMINISTRADOR)
  ) {
    throw new ForbiddenException('Sem permissão para gerenciar administrador');
  }
}
