import { IsUUID } from 'class-validator';

export class AssignThreatAlertDto {
  @IsUUID('all')
  id: string;
}
