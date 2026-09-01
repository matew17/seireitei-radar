import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { ValidationError } from './common/errors/domain-error';
import { PrismaModule } from './prisma/prisma.module';
import { SquadsModule } from './squads/squads.module';
import type { ValidationError as ClassValidationError } from 'class-validator';

function formatValidationMessages(errors: ClassValidationError[]): string {
  const messages = errors.flatMap((error) =>
    error.constraints ? Object.values(error.constraints) : [],
  );

  return messages.length > 0 ? messages.join('; ') : 'Invalid squad input';
}

@Module({
  imports: [PrismaModule, SquadsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          exceptionFactory: (errors: ClassValidationError[]) =>
            new ValidationError(formatValidationMessages(errors)),
        }),
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
