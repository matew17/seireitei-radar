import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';

describe('DomainExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn<void, [unknown]>();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status, json };
    const host = {
      switchToHttp: jest.fn().mockReturnValue({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    return { host, response, status, json };
  };

  it('returns a safe conflict response for domain errors', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = createHost();

    const error = {
      statusCode: HttpStatus.CONFLICT,
      code: 'SQUAD_NUMBER_EXISTS',
      message: 'Squad number already exists',
      cause: new Error('prisma unique constraint details'),
      stack: 'internal stack trace',
    };

    filter.catch(error as never, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      code: 'SQUAD_NUMBER_EXISTS',
      message: 'Squad number already exists',
    });
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      'prisma unique constraint details',
    );
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      'internal stack trace',
    );
  });

  it('returns a safe not-found response for domain errors', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = createHost();

    const error = {
      statusCode: HttpStatus.NOT_FOUND,
      code: 'NOT_FOUND',
      message: 'Squad not found',
      cause: new Error('record not found in persistence layer'),
    };

    filter.catch(error as never, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Squad not found',
    });
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      'record not found in persistence layer',
    );
  });
});
