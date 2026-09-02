jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ValidationError } from '../../common/errors/domain-error';
import { ThreatAlertsService } from './threat-alerts.service';

describe('ThreatAlertsService', () => {
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

  const eligibleSquad = {
    id: 'eligible-squad-id',
    number: 1,
    captainName: 'Genryusai Shigekuni Yamamoto',
    isAvailable: true,
    maxThreatLevel: 3,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };

  describe('create', () => {
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

    it('BR-01: returns eligible squads alongside the saved threat', async () => {
      findEligibleSquads.mockResolvedValue([eligibleSquad]);
      create.mockResolvedValue(createdAlert);

      await expect(service.create(alertInput)).resolves.toEqual({
        ...createdAlert,
        candidateSquads: [eligibleSquad],
      });
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

  describe('update', () => {
    const existingAlert = {
      id: 'alert-id',
      threatLevel: 2,
      latitude: 35.1,
      longitude: 139.1,
      status: 'PENDING' as const,
      squadId: null,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    };

    type ThreatAlertsRepositoryStub = {
      update(
        id: string,
        data: Record<string, unknown>,
      ): Promise<typeof existingAlert | null>;
      findEligibleSquads(threatLevel: number): Promise<unknown[]>;
    };

    let update: jest.MockedFunction<ThreatAlertsRepositoryStub['update']>;
    let findEligibleSquads: jest.MockedFunction<
      ThreatAlertsRepositoryStub['findEligibleSquads']
    >;
    let service: ThreatAlertsService;

    beforeEach(() => {
      update = jest.fn();
      findEligibleSquads = jest.fn();
      service = new ThreatAlertsService({
        update,
        findEligibleSquads,
      } as never);
    });

    it('BR-01: returns candidate squads when severity is submitted', async () => {
      const updatedAlert = {
        ...existingAlert,
        threatLevel: 3,
      };

      update.mockResolvedValue(updatedAlert);
      findEligibleSquads.mockResolvedValue([eligibleSquad]);

      await expect(
        service.update(existingAlert.id, { threatLevel: 3 }),
      ).resolves.toEqual({
        ...updatedAlert,
        candidateSquads: [eligibleSquad],
      });
      expect(update).toHaveBeenCalledWith(existingAlert.id, { threatLevel: 3 });
      expect(findEligibleSquads).toHaveBeenCalledWith(3);
    });

    it('preserves the existing response for location-only updates', async () => {
      update.mockResolvedValue(existingAlert);

      await expect(
        service.update(existingAlert.id, { latitude: 35.9 }),
      ).resolves.toEqual(existingAlert);
      expect(update).toHaveBeenCalledWith(existingAlert.id, { latitude: 35.9 });
      expect(findEligibleSquads).not.toHaveBeenCalled();
    });

    it('BR-04: translates a check-constraint rejection into a client-safe validation error', async () => {
      update.mockRejectedValue(
        Object.assign(new Error('Prisma internal check constraint details'), {
          code: 'P2004',
        }),
      );

      let thrown: unknown;
      try {
        await service.update(existingAlert.id, { threatLevel: 4 });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(ValidationError);
      expect(thrown).toMatchObject({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'ThreatAlert threatLevel must be 1, 2, or 3',
      });
      expect(findEligibleSquads).not.toHaveBeenCalled();
    });
  });
});
