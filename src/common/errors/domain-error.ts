export type DomainErrorCode = 'CONFLICT' | 'NOT_FOUND' | 'VALIDATION_ERROR';

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: DomainErrorCode,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
