import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { ThreatAlert } from '../../../generated/prisma/client';
import { CreateThreatAlertDto } from '../dto/create-threat-alert.dto';
import { UpdateThreatAlertDto } from '../dto/update-threat-alert.dto';
import {
  ThreatAlertsService,
  type ThreatAlertResponse,
} from '../services/threat-alerts.service';

@Controller('threat-alerts')
export class ThreatAlertsController {
  constructor(private readonly threatAlertsService: ThreatAlertsService) {}

  @Post()
  create(
    @Body() createThreatAlertDto: CreateThreatAlertDto,
  ): Promise<ThreatAlertResponse> {
    return this.threatAlertsService.create(createThreatAlertDto);
  }

  @Get()
  findAll(): Promise<ThreatAlert[]> {
    return this.threatAlertsService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ThreatAlert> {
    return this.threatAlertsService.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateThreatAlertDto: UpdateThreatAlertDto,
  ): Promise<ThreatAlertResponse> {
    return this.threatAlertsService.update(id, updateThreatAlertDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ThreatAlert> {
    return this.threatAlertsService.remove(id);
  }
}
