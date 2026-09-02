import { Module } from '@nestjs/common';
import { ThreatAlertsController } from './controllers/threat-alerts.controller';
import { ThreatAlertsRepository } from './repositories/threat-alerts.repository';
import { ThreatAlertsService } from './services/threat-alerts.service';

@Module({
  controllers: [ThreatAlertsController],
  providers: [ThreatAlertsService, ThreatAlertsRepository],
})
export class ThreatAlertsModule {}
