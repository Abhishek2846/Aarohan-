import { Module } from '@nestjs/common';
import { LitigationController } from './litigation.controller';
import { LitigationService } from './litigation.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LitigationController],
  providers: [LitigationService],
  exports: [LitigationService],
})
export class LitigationModule {}
