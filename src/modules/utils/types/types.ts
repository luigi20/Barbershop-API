import { Request } from 'express';
import { MemberRole } from '../enum';

export interface AuthRequest extends Request {
  auth: {
    identity_id: string;
    profile_id: string;
    entity_id: string;
    roles?: MemberRole[];
    name?: string;
    photo?: string;
  };
}

export type entity_name = {
  id: string;
  entity_name: string;
  roles: string[];
};
