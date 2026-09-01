import { IsIn, IsInt, IsNumber } from 'class-validator';

export class CreateThreatAlertDto {
  @IsInt()
  @IsIn([1, 2, 3])
  threatLevel: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
