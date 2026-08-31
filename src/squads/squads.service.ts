import { Injectable } from '@nestjs/common';
import { ConflictError } from '../common/errors/domain-error';
import { SquadsRepository } from './squads.repository';

type CreateSquadInput = {
  number: number;
  captainName: string;
  isAvailable?: boolean;
  maxThreatLevel: number;
  currentLat: number;
  currentLng: number;
};

type Squad = Required<CreateSquadInput> & { id: string };

type SquadCreator = {
  create(data: CreateSquadInput): Promise<Squad>;
};

type PrismaError = {
  code?: string;
};

@Injectable()
export class SquadsService {
  constructor(private readonly squadsRepository: SquadsRepository) {}

  async create(data: CreateSquadInput): Promise<Squad> {
    try {
      return await (this.squadsRepository as unknown as SquadCreator).create(
        data,
      );
    } catch (error) {
      if ((error as PrismaError).code === 'P2002') {
        throw new ConflictError('Squad number already exists');
      }

      throw error;
    }
  }
}
