import { Body, Controller, Post } from '@nestjs/common';
import type { ThreatAlert } from '../../../generated/prisma/client';
import { CreateThreatAlertDto } from '../dto/create-threat-alert.dto';
import { ThreatAlertsService } from '../services/threat-alerts.service';

@Controller('threat-alerts')
export class ThreatAlertsController {
  constructor(private readonly threatAlertsService: ThreatAlertsService) {}

  @Post()
  create(
    @Body() createThreatAlertDto: CreateThreatAlertDto,
  ): Promise<ThreatAlert> {
    return this.threatAlertsService.create(createThreatAlertDto);
  }
}
