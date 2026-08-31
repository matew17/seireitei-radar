import { Injectable } from '@nestjs/common';
import { SquadsRepository } from './squads.repository';

@Injectable()
export class SquadsService {
  constructor(private readonly squadsRepository: SquadsRepository) {}
}
