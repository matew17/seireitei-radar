import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { ValidationError as ClassValidationError } from 'class-validator';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationError } from '../src/common/errors/domain-error';

function formatValidationMessages(errors: ClassValidationError[]): string {
  const messages = errors.flatMap((error) =>
    error.constraints ? Object.values(error.constraints) : [],
  );

  return messages.length > 0 ? messages.join('; ') : 'Invalid squad input';
}

export function configureHttpApplication(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ClassValidationError[]) =>
        new ValidationError(formatValidationMessages(errors)),
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
}
