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

export type AutomaticAssignmentResult =
  | {
      kind: 'NOT_FOUND';
    }
  | {
      kind: 'NOT_PENDING_OR_UNASSIGNED';
    }
  | {
      kind: 'NO_ELIGIBLE_SQUAD';
    }
  | {
      kind: 'ASSIGNED';
      threatAlert: ThreatAlert;
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
      orderBy: {
        number: 'asc',
      },
    });
  }

  async assignAutomatically(id: string): Promise<AutomaticAssignmentResult> {
    return this.prisma.$transaction(async (tx) => {
      const threatAlerts = await tx.$queryRaw<ThreatAlert[]>`
        SELECT *
        FROM "ThreatAlert"
        WHERE "id" = ${id}
        FOR UPDATE
      `;
      const threatAlert = threatAlerts[0];

      if (!threatAlert) {
        return {
          kind: 'NOT_FOUND',
        };
      }

      if (threatAlert.status !== 'PENDING' || threatAlert.squadId !== null) {
        return {
          kind: 'NOT_PENDING_OR_UNASSIGNED',
        };
      }

      const eligibleSquads = await tx.$queryRaw<Squad[]>`
        SELECT *
        FROM "Squad"
        WHERE "isAvailable" = true
          AND "maxThreatLevel" >= ${threatAlert.threatLevel}
        ORDER BY "number" ASC
        LIMIT 1
        FOR UPDATE
      `;
      const selectedSquad = eligibleSquads[0];

      if (!selectedSquad) {
        return {
          kind: 'NO_ELIGIBLE_SQUAD',
        };
      }

      try {
        const assignedThreatAlert = await tx.threatAlert.update({
          where: {
            id: threatAlert.id,
          },
          data: {
            squadId: selectedSquad.id,
            status: 'ASSIGNED',
          },
        });

        return {
          kind: 'ASSIGNED',
          threatAlert: assignedThreatAlert,
        };
      } catch (error: unknown) {
        if (this.isCheckConstraintError(error)) {
          return {
            kind: 'NO_ELIGIBLE_SQUAD',
          };
        }

        throw error;
      }
    });
  }

  private isCheckConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2004'
    );
  }
}
