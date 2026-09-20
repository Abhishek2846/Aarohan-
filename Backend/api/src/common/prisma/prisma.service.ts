import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { types } from 'pg';

// Parse INET (oid 869) and CIDR (oid 650) as plain string
types.setTypeParser(869, (val: any) => (val ? String(val) : '127.0.0.1'));
types.setTypeParser(650, (val: any) => (val ? String(val) : '127.0.0.1'));

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://bhoomi:bhoomi_pass@127.0.0.1:5432/bhoomi_setu?schema=public';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
