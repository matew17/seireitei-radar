import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Squad,
  ThreatAlert,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ThreatAlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ThreatAlertCreateInput): Promise<ThreatAlert> {
    return this.prisma.threatAlert.create({ data });
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
