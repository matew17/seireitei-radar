import { Module } from '@nestjs/common';
import { SquadsController } from './controllers/squads.controller';
import { SquadsRepository } from './repositories/squads.repository';
import { SquadsService } from './services/squads.service';

@Module({
  controllers: [SquadsController],
  providers: [SquadsService, SquadsRepository],
})
export class SquadsModule {}
