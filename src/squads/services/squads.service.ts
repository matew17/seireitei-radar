import { Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import type { Prisma, Squad } from '../../../generated/prisma/client';
import { SquadsRepository } from '../squads.repository';

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

  async list(): Promise<Squad[]> {
    return this.squadsRepository.list();
  }

  async get(id: string): Promise<Squad> {
    const squad = await this.squadsRepository.get(id);

    if (!squad) {
      throw new NotFoundError();
    }

    return squad;
  }

  async update(
    id: string,
    data: Prisma.SquadUpdateManyMutationInput,
  ): Promise<Squad> {
    let squad: Squad | null;

    try {
      squad = await this.squadsRepository.update(id, data);
    } catch (error: unknown) {
      throw this.translatePrismaWriteError(error);
    }

    if (!squad) {
      throw new NotFoundError();
    }

    return squad;
  }

  async remove(id: string): Promise<Squad> {
    const squad = await this.squadsRepository.markUnavailable(id);

    if (!squad) {
      throw new NotFoundError();
    }

    return squad;
  }

  private translatePrismaWriteError(error: unknown): unknown {
    if (this.isUniqueConstraintError(error)) {
      return new ConflictError('Squad number already exists');
    }

    if (this.isCheckConstraintError(error)) {
      return new ValidationError('Squad maxThreatLevel must be 1, 2, or 3');
    }

    return error;
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return this.isKnownRequestError(error, 'P2002');
  }

  private isCheckConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return this.isKnownRequestError(error, 'P2004');
  }

  private isKnownRequestError(
    error: unknown,
    code: Prisma.PrismaClientKnownRequestError['code'],
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === code
    );
  }
}
