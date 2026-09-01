import { Body, Controller, Post } from '@nestjs/common';
import { CreateSquadDto } from './dto/create-squad.dto';
import { SquadsService } from './squads.service';

@Controller('squads')
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  create(@Body() createSquadDto: CreateSquadDto) {
    return this.squadsService.create(createSquadDto);
  }
}
