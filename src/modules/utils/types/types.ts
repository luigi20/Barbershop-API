import { Request } from 'express';

export interface AuthRequest extends Request {
  auth: {
    user_id: string;
    context_id: string;
    tenant_id: string;
    role: string;
  };
}
