import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnApplicationShutdown {
  [x: string]: any;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async onApplicationShutdown(signal?: string) {
    await this.prisma.$disconnect();
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
