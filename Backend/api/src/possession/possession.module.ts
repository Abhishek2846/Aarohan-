import { Module } from '@nestjs/common';
import { PossessionController } from './possession.controller';
import { PossessionService } from './possession.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PossessionController],
  providers: [PossessionService],
  exports: [PossessionService],
})
export class PossessionModule {}
