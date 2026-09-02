import {
  IsIn,
  IsInt,
  IsNumber,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasAtLeastOneThreatAlertField', async: false })
class HasAtLeastOneThreatAlertFieldConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    return ['threatLevel', 'latitude', 'longitude'].some(
      (field) => object[field] !== undefined,
    );
  }

  defaultMessage(): string {
    return 'At least one threat alert field must be provided';
  }
}

function HasAtLeastOneThreatAlertField(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'hasAtLeastOneThreatAlertField',
      target: object.constructor,
      propertyName,
      options,
      validator: HasAtLeastOneThreatAlertFieldConstraint,
    });
  };
}

export class UpdateThreatAlertDto {
  @HasAtLeastOneThreatAlertField()
  private readonly _atLeastOneField?: never;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @IsIn([1, 2, 3])
  threatLevel?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber()
  latitude?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber()
  longitude?: number;
}
