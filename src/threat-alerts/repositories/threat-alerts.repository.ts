import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Squad,
  ThreatAlert,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ThreatAlertUpdateInput = {
  threatLevel?: number;
  latitude?: number;
  longitude?: number;
};

@Injectable()
export class ThreatAlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ThreatAlertCreateInput): Promise<ThreatAlert> {
    return this.prisma.threatAlert.create({ data });
  }

  async list(): Promise<ThreatAlert[]> {
    return this.prisma.threatAlert.findMany();
  }

  async get(id: string): Promise<ThreatAlert | null> {
    return this.prisma.threatAlert.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: ThreatAlertUpdateInput,
  ): Promise<ThreatAlert | null> {
    const updateData: Prisma.ThreatAlertUpdateManyMutationInput = {};

    if (data.threatLevel !== undefined) {
      updateData.threatLevel = data.threatLevel;
    }

    if (data.latitude !== undefined) {
      updateData.latitude = data.latitude;
    }

    if (data.longitude !== undefined) {
      updateData.longitude = data.longitude;
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.threatAlert.updateMany({
        where: { id },
        data: updateData,
      });

      if (result.count === 0) {
        return null;
      }

      return tx.threatAlert.findUnique({
        where: { id },
      });
    });
  }

  async markResolved(id: string): Promise<ThreatAlert | null> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.threatAlert.updateMany({
        where: { id },
        data: {
          status: 'RESOLVED',
        },
      });

      if (result.count === 0) {
        return null;
      }

      return tx.threatAlert.findUnique({
        where: { id },
      });
    });
  }

  async findEligibleSquads(threatLevel: number): Promise<Squad[]> {
    return this.prisma.squad.findMany({
      where: {
        isAvailable: true,
        maxThreatLevel: {
          gte: threatLevel,
        },
      },
    });
  }
}
