import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnApplicationShutdown {
  [x: string]: any;
  private prisma: PrismaClient;

  constructor() {
    // 1. Configura a string de conexão usando a variável de ambiente
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Cria o adaptador do PostgreSQL para o Prisma
    const adapter = new PrismaPg(pool);

    // 3. Injeta o adaptador na instância do PrismaClient
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async onApplicationShutdown() {
    await this.prisma.$disconnect();
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
