import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { Squad } from '../../../generated/prisma/client';
import { CreateSquadDto } from '../dto/create-squad.dto';
import { UpdateSquadDto } from '../dto/update-squad.dto';
import { SquadsService } from '../services/squads.service';

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSquadDto: UpdateSquadDto,
  ): Promise<Squad> {
    return this.squadsService.update(id, updateSquadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Squad> {
    return this.squadsService.remove(id);
  }
}
