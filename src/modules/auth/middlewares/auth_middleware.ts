import { AppError } from '@modules/utils/app_error';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwt_service: JwtService) {}
  use(req: Request & { auth?: any }, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError('Token ausente');
    try {
      const payload: any = this.jwt_service.verify(token);
      req.auth = {
        user_id: payload.sub,
        context_id: payload.context_id,
        tenant_id: payload.tenant_id,
        role: payload.role,
      };
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
}
