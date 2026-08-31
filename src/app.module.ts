import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SquadsModule } from './squads/squads.module';

@Module({
  imports: [PrismaModule, SquadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
