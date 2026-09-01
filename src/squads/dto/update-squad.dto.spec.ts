import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSquadDto } from './update-squad.dto';

describe('UpdateSquadDto', () => {
  const validPayload = {
    number: 1,
    captainName: 'Genryusai Shigekuni Yamamoto',
    isAvailable: true,
    maxThreatLevel: 3,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };

  const errorsFor = (payload: unknown) =>
    validate(plainToInstance(UpdateSquadDto, payload));

  it('accepts any non-empty subset of mutable squad fields', async () => {
    for (const field of Object.keys(validPayload) as Array<
      keyof typeof validPayload
    >) {
      await expect(
        errorsFor({ [field]: validPayload[field] }),
      ).resolves.toHaveLength(0);
    }

    await expect(errorsFor(validPayload)).resolves.toHaveLength(0);
  });

  it('rejects an empty partial update payload', async () => {
    await expect(errorsFor({})).resolves.not.toHaveLength(0);
  });

  it('rejects invalid field values while allowing omitted fields', async () => {
    const cases = [
      ['number', 1.5],
      ['captainName', '   '],
      ['isAvailable', 'true'],
      ['currentLat', '35.6762'],
      ['currentLng', '139.6503'],
    ] as const;

    for (const [field, value] of cases) {
      const errors = await errorsFor({ [field]: value });
      expect(errors.some((error) => error.property === field)).toBe(true);
    }

    await expect(errorsFor({ captainName: 'Squad 1' })).resolves.toHaveLength(
      0,
    );
    await expect(errorsFor({ currentLat: 0 })).resolves.toHaveLength(0);
    await expect(errorsFor({ currentLng: 0 })).resolves.toHaveLength(0);
  });

  it('BR-03: accepts only maxThreatLevel 1, 2, or 3 in a partial update', async () => {
    for (const maxThreatLevel of [1, 2, 3]) {
      await expect(errorsFor({ maxThreatLevel })).resolves.toHaveLength(0);
    }
  });

  it('BR-03: rejects a partial update with maxThreatLevel outside 1, 2, or 3', async () => {
    for (const maxThreatLevel of [0, 4]) {
      const errors = await errorsFor({ maxThreatLevel });
      expect(errors.some((error) => error.property === 'maxThreatLevel')).toBe(
        true,
      );
    }
  });
});
