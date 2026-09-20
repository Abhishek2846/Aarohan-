import { Module } from '@nestjs/common';
import { RrController } from './rr.controller';
import { RrService } from './rr.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RrController],
  providers: [RrService],
  exports: [RrService],
})
export class RrModule {}
