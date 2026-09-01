import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidateIf,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasAtLeastOneSquadField', async: false })
class HasAtLeastOneSquadFieldConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    return [
      object.number,
      object.captainName,
      object.isAvailable,
      object.maxThreatLevel,
      object.currentLat,
      object.currentLng,
    ].some((value) => value !== undefined);
  }

  defaultMessage(): string {
    return 'At least one squad field must be provided';
  }
}

function HasAtLeastOneSquadField(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'hasAtLeastOneSquadField',
      target: object.constructor,
      propertyName,
      options,
      validator: HasAtLeastOneSquadFieldConstraint,
    });
  };
}

export class UpdateSquadDto {
  @HasAtLeastOneSquadField()
  private readonly _atLeastOneField?: never;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  number?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  captainName?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isAvailable?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @IsIn([1, 2, 3])
  maxThreatLevel?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber()
  currentLat?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber()
  currentLng?: number;
}
