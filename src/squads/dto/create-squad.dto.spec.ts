import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSquadDto } from './create-squad.dto';

describe('CreateSquadDto', () => {
  const validPayload = {
    number: 1,
    captainName: 'Genryusai Shigekuni Yamamoto',
    maxThreatLevel: 3,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };

  it('accepts squad creation data when maxThreatLevel is 1, 2, or 3', async () => {
    await expect(
      validate(plainToInstance(CreateSquadDto, validPayload)),
    ).resolves.toHaveLength(0);

    const omittedIsAvailableErrors = await validate(
      plainToInstance(CreateSquadDto, validPayload),
    );
    expect(omittedIsAvailableErrors).toHaveLength(0);

    const nullIsAvailableErrors = await validate(
      plainToInstance(CreateSquadDto, { ...validPayload, isAvailable: null }),
    );
    expect(
      nullIsAvailableErrors.some((error) => error.property === 'isAvailable'),
    ).toBe(true);

    for (const maxThreatLevel of [1, 2, 3]) {
      const errors = await validate(
        plainToInstance(CreateSquadDto, { ...validPayload, maxThreatLevel }),
      );

      expect(errors).toHaveLength(0);
    }
  });

  it('BR-03: rejects squad creation data when maxThreatLevel is outside 1, 2, or 3', async () => {
    for (const maxThreatLevel of [0, 4]) {
      const errors = await validate(
        plainToInstance(CreateSquadDto, { ...validPayload, maxThreatLevel }),
      );

      expect(errors.some((error) => error.property === 'maxThreatLevel')).toBe(
        true,
      );
    }
  });
});
