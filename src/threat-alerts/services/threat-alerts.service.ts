import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Squad,
  ThreatAlert,
} from '../../../generated/prisma/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import {
  type AutomaticAssignmentResult,
  ThreatAlertsRepository,
  type ThreatAlertUpdateInput,
} from '../repositories/threat-alerts.repository';

const threatAlertUpdateFields = [
  'threatLevel',
  'latitude',
  'longitude',
] as const;

export type ThreatAlertWithCandidateSquads = ThreatAlert & {
  candidateSquads: Squad[];
};

export type ThreatAlertResponse = ThreatAlert | ThreatAlertWithCandidateSquads;

@Injectable()
export class ThreatAlertsService {
  constructor(
    private readonly threatAlertsRepository: ThreatAlertsRepository,
  ) {}

  async create(
    data: Prisma.ThreatAlertCreateInput,
  ): Promise<ThreatAlertWithCandidateSquads> {
    try {
      const threatAlert = await this.threatAlertsRepository.create(data);
      const candidateSquads =
        await this.threatAlertsRepository.findEligibleSquads(
          threatAlert.threatLevel,
        );

      return {
        ...threatAlert,
        candidateSquads,
      };
    } catch (error: unknown) {
      if (this.isCheckConstraintError(error)) {
        throw new ValidationError('ThreatAlert threatLevel must be 1, 2, or 3');
      }

      throw error;
    }
  }

  async list(): Promise<ThreatAlert[]> {
    return this.threatAlertsRepository.list();
  }

  async assign(id: string): Promise<ThreatAlert> {
    const result = await this.threatAlertsRepository.assignAutomatically(id);

    return this.mapAssignmentResult(result);
  }

  async update(
    id: string,
    data: ThreatAlertUpdateInput,
  ): Promise<ThreatAlertResponse> {
    try {
      this.assertThreatAlertUpdateFields(data);
      const threatAlert = await this.threatAlertsRepository.update(id, data);

      if (!threatAlert) {
        throw new NotFoundError('ThreatAlert not found');
      }

      if (data.threatLevel !== undefined) {
        const candidateSquads =
          await this.threatAlertsRepository.findEligibleSquads(
            threatAlert.threatLevel,
          );

        return {
          ...threatAlert,
          candidateSquads,
        };
      }

      return threatAlert;
    } catch (error: unknown) {
      if (this.isCheckConstraintError(error)) {
        throw new ValidationError('ThreatAlert threatLevel must be 1, 2, or 3');
      }

      throw error;
    }
  }

  async get(id: string): Promise<ThreatAlert> {
    const threatAlert = await this.threatAlertsRepository.get(id);

    if (!threatAlert) {
      throw new NotFoundError('ThreatAlert not found');
    }

    return threatAlert;
  }

  async remove(id: string): Promise<ThreatAlert> {
    const threatAlert = await this.threatAlertsRepository.markResolved(id);

    if (!threatAlert) {
      throw new NotFoundError('ThreatAlert not found');
    }

    return threatAlert;
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

  private assertThreatAlertUpdateFields(data: ThreatAlertUpdateInput): void {
    const forbiddenFields = Object.keys(data).filter(
      (field) =>
        !field.startsWith('_') &&
        !threatAlertUpdateFields.includes(field as never),
    );

    if (forbiddenFields.length > 0) {
      throw new ValidationError(
        'ThreatAlert updates may only include threatLevel, latitude, and longitude',
      );
    }
  }

  private mapAssignmentResult(result: AutomaticAssignmentResult): ThreatAlert {
    switch (result.kind) {
      case 'ASSIGNED':
        return result.threatAlert;
      case 'NOT_FOUND':
        throw new NotFoundError('ThreatAlert not found');
      case 'NOT_PENDING_OR_UNASSIGNED':
        throw new ConflictError('ThreatAlert is not pending and unassigned');
      case 'NO_ELIGIBLE_SQUAD':
        throw new ConflictError('No eligible squad available');
    }
  }
}
