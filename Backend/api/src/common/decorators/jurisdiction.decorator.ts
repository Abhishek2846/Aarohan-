import { SetMetadata } from '@nestjs/common';

export const CHECK_JURISDICTION_KEY = 'check_jurisdiction';

export interface JurisdictionCheckOptions {
  param?: string;
  bodyField?: string;
  resource: 'case' | 'project';
}

export const CheckJurisdiction = (options: JurisdictionCheckOptions) =>
  SetMetadata(CHECK_JURISDICTION_KEY, options);
