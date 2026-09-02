jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ValidationError } from '../../common/errors/domain-error';
import { ThreatAlertsService } from './threat-alerts.service';

describe('ThreatAlertsService create', () => {
  const alertInput = {
    threatLevel: 2,
    latitude: 35.1,
    longitude: 139.1,
  };

  const createdAlert = {
    id: 'alert-id',
    ...alertInput,
    status: 'PENDING' as const,
    squadId: null,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  type ThreatAlertsRepositoryStub = {
    create(data: typeof alertInput): Promise<typeof createdAlert>;
    findEligibleSquads(threatLevel: number): Promise<unknown[]>;
  };

  let create: jest.MockedFunction<ThreatAlertsRepositoryStub['create']>;
  let findEligibleSquads: jest.MockedFunction<
    ThreatAlertsRepositoryStub['findEligibleSquads']
  >;
  let service: ThreatAlertsService;

  beforeEach(() => {
    create = jest.fn();
    findEligibleSquads = jest.fn();
    service = new ThreatAlertsService({
      create,
      findEligibleSquads,
    } as never);
  });

  it('BR-01: persists a pending alert and evaluates eligible squads for the reported level', async () => {
    findEligibleSquads.mockResolvedValue([
      {
        id: 'eligible-squad-id',
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    ]);
    create.mockResolvedValue(createdAlert);

    await expect(service.create(alertInput)).resolves.toEqual(createdAlert);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(alertInput);
    expect(findEligibleSquads).toHaveBeenCalledTimes(1);
    expect(findEligibleSquads).toHaveBeenCalledWith(alertInput.threatLevel);
  });

  it('BR-04: translates a check-constraint rejection into a client-safe validation error', async () => {
    create.mockRejectedValue(
      Object.assign(new Error('Prisma internal check constraint details'), {
        code: 'P2004',
      }),
    );

    let thrown: unknown;
    try {
      await service.create(alertInput);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown).toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message: 'ThreatAlert threatLevel must be 1, 2, or 3',
    });
    expect((thrown as Error).message).not.toContain('Prisma internal');
    expect(findEligibleSquads).not.toHaveBeenCalled();
  });
});

describe('ThreatAlertsService maintenance boundary', () => {
  const existingAlert = {
    id: 'alert-id',
    threatLevel: 2,
    latitude: 35.1,
    longitude: 139.1,
    status: 'PENDING' as const,
    squadId: null,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  it('rejects status and squad mutations instead of forwarding them to the repository', async () => {
    const update = jest.fn().mockResolvedValue(existingAlert);
    const service = new ThreatAlertsService({ update } as never);

    await expect(
      service.update(existingAlert.id, {
        status: 'RESOLVED',
        squadId: 'assigned-squad-id',
      } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(update).not.toHaveBeenCalled();
  });
});
