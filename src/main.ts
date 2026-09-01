import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { ValidationError as ClassValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { ValidationError } from './common/errors/domain-error';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

function formatValidationMessages(errors: ClassValidationError[]): string {
  const messages = errors.flatMap((error) =>
    error.constraints ? Object.values(error.constraints) : [],
  );

  return messages.length > 0 ? messages.join('; ') : 'Invalid squad input';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  const config = new DocumentBuilder()
    .setTitle('Seiretei API')
    .setDescription('Documentacion para la API de Seiretei')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
