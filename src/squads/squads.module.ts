import { Module } from '@nestjs/common';
import { SquadsController } from './controllers/squads.controller';
import { SquadsRepository } from './squads.repository';
import { SquadsService } from './squads.service';

@Module({
  controllers: [SquadsController],
  providers: [SquadsService, SquadsRepository],
})
export class SquadsModule {}
