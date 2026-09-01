import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateSquadDto {
  @IsInt()
  number: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  captainName: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isAvailable?: boolean;

  @IsInt()
  @IsIn([1, 2, 3])
  maxThreatLevel: number;

  @IsNumber()
  currentLat: number;

  @IsNumber()
  currentLng: number;
}
