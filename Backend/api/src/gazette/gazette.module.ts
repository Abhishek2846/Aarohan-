import { Module } from '@nestjs/common';
import { GazetteController } from './gazette.controller';
import { GazetteService } from './gazette.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GazetteController],
  providers: [GazetteService],
  exports: [GazetteService],
})
export class GazetteModule {}
