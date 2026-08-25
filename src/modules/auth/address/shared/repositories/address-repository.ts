import { Injectable } from '@nestjs/common';
import { IAddressRepository } from './abstract_class/iaddress-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { AddressMapper } from 'infra/database/mappers/AddressMapper';
import { Prisma } from '@prisma/client';
import { Address } from '../models/address';

@Injectable()
class AddressRepository implements IAddressRepository {
  constructor(private prisma: PrismaService) {}
  async findByListEntityId(list_entity_id: string[]): Promise<Address[]> {
    const list_address = await this.prisma.getPrismaClient().address.findMany({
      where: {
        entity_id: {
          in: list_entity_id,
        },
      },
    });
    return list_address.map((item) => AddressMapper.toDomain(item));
  }

  async findByEntityId(entity_id: string): Promise<Address | null> {
    const address = await this.prisma.getPrismaClient().address.findFirst({
      where: {
        entity_id: entity_id,
      },
    });
    if (!entity_id) return null;
    return AddressMapper.toDomain(address);
  }

  async findById(id: string): Promise<Address | null> {
    const address = await this.prisma.getPrismaClient().address.findFirst({
      where: {
        id: id,
      },
    });
    if (!address) return null;
    return AddressMapper.toDomain(address);
  }

  async create(data: Address, tx?: Prisma.TransactionClient): Promise<void> {
    const raw = AddressMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.address.create({
      data: {
        ...raw,
        entity: {
          connect: {
            id: data.entity_id,
          },
        },
      },
    });
  }
  async update(data: Address, tx?: Prisma.TransactionClient): Promise<void> {
    const raw = AddressMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.address.update({
      where: {
        id: data._id,
      },
      data: raw,
    });
  }
}

export { AddressRepository };
