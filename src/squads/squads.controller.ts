import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { Squad } from '../../generated/prisma/client';
import { CreateSquadDto } from './dto/create-squad.dto';
import { SquadsService } from './squads.service';

@Controller('squads')
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  create(@Body() createSquadDto: CreateSquadDto) {
    return this.squadsService.create(createSquadDto);
  }

  @Get()
  findAll(): Promise<Squad[]> {
    return this.squadsService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Squad> {
    return this.squadsService.get(id);
  }
}
