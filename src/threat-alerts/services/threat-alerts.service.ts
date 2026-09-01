import { Injectable } from '@nestjs/common';
import type { Prisma, ThreatAlert } from '../../../generated/prisma/client';
import { ValidationError } from '../../common/errors/domain-error';
import { ThreatAlertsRepository } from '../repositories/threat-alerts.repository';

@Injectable()
export class ThreatAlertsService {
  constructor(
    private readonly threatAlertsRepository: ThreatAlertsRepository,
  ) {}

  async create(data: Prisma.ThreatAlertCreateInput): Promise<ThreatAlert> {
    try {
      const threatAlert = await this.threatAlertsRepository.create(data);
      await this.threatAlertsRepository.findEligibleSquads(
        threatAlert.threatLevel,
      );

      return threatAlert;
    } catch (error: unknown) {
      if (this.isCheckConstraintError(error)) {
        throw new ValidationError('ThreatAlert threatLevel must be 1, 2, or 3');
      }

      throw error;
    }
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
