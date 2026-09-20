import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationsService {
  getStatus() {
    return { module: 'integrations', status: 'operational' };
  }
}
