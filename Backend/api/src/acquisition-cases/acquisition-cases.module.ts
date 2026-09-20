import { Module } from '@nestjs/common';
import { AcquisitionCasesController } from './acquisition-cases.controller';
import { AcquisitionCasesService } from './acquisition-cases.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcquisitionCasesController],
  providers: [AcquisitionCasesService],
  exports: [AcquisitionCasesService],
})
export class AcquisitionCasesModule {}
