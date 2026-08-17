import { AppError } from '@modules/utils/app_error';
import { AuthRequest } from '@modules/utils/types/types';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class SuperUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.auth;
    if (!user) throw new AppError('Usuário não pode acessar essa rota', 401);
    if (!user.is_superuser) throw new AppError('Acesso negado', 403);
    return true;
  }
}
