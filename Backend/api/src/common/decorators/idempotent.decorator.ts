import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent_key';

export interface IdempotentOptions {
  required?: boolean;
  ttlSeconds?: number;
}

export const Idempotent = (options: IdempotentOptions = { required: false, ttlSeconds: 86400 }) =>
  SetMetadata(IDEMPOTENT_KEY, options);
