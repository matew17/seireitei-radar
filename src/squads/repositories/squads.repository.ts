import { Injectable } from '@nestjs/common';
import type { Prisma, Squad } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SquadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SquadCreateInput): Promise<Squad> {
    return this.prisma.squad.create({ data });
  }

  async list(): Promise<Squad[]> {
    return this.prisma.squad.findMany();
  }

  async get(id: string): Promise<Squad | null> {
    return this.prisma.squad.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Prisma.SquadUpdateManyMutationInput,
  ): Promise<Squad | null> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.squad.updateMany({
        where: { id },
        data,
      });

      if (result.count === 0) {
        return null;
      }

      return tx.squad.findUnique({
        where: { id },
      });
    });
  }

  async markUnavailable(id: string): Promise<Squad | null> {
    return this.update(id, {
      isAvailable: false,
    });
  }
}
