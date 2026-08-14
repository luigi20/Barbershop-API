import { SetMetadata } from '@nestjs/common';
import { TokenType } from '../../utils/enum';

export const TOKEN_TYPE_KEY = 'token_type';

export const TokenTypeRequired = (...types: TokenType[]) =>
  SetMetadata(TOKEN_TYPE_KEY, types);
