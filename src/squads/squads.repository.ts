import { Injectable } from '@nestjs/common';
import type { Prisma, Squad } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
