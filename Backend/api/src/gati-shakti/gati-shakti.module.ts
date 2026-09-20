import { Module } from '@nestjs/common';
import { GatiShaktiController } from './gati-shakti.controller';
import { GatiShaktiService } from './gati-shakti.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GatiShaktiController],
  providers: [GatiShaktiService],
  exports: [GatiShaktiService],
})
export class GatiShaktiModule {}
