import { Injectable } from '@nestjs/common';
import { ConflictError } from '../common/errors/domain-error';
import type { Prisma, Squad } from '../../generated/prisma/client';
import { SquadsRepository } from './squads.repository';

@Injectable()
export class SquadsService {
  constructor(private readonly squadsRepository: SquadsRepository) {}

  async create(data: Prisma.SquadCreateInput): Promise<Squad> {
    try {
      return await this.squadsRepository.create(data);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictError('Squad number already exists');
      }

      throw error;
    }
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
