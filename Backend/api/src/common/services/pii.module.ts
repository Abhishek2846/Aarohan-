import { Global, Module } from '@nestjs/common';
import { PiiEncryptionService } from './pii-encryption.service';

@Global()
@Module({
  providers: [PiiEncryptionService],
  exports: [PiiEncryptionService],
})
export class PiiModule {}
