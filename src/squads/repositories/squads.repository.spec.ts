jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { SquadsRepository } from './squads.repository';

describe('SquadsRepository create', () => {
  it('persists valid squad details and returns the created record', async () => {
    const input = {
      number: 13,
      captainName: 'Jushiro Ukitake',
      isAvailable: false,
      maxThreatLevel: 2,
      currentLat: 35.6762,
      currentLng: 139.6503,
    };
    const persistedSquad = {
      id: 'generated-squad-id',
      ...input,
    };
    const create = jest.fn().mockResolvedValue(persistedSquad);
    const prisma = { squad: { create } };
    const repository = new SquadsRepository(prisma as never);

    await expect(repository.create(input)).resolves.toEqual(persistedSquad);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({ data: input });
  });
});

describe('SquadsRepository roster and lookup', () => {
  const availableSquad = {
    id: 'available-squad-id',
    number: 1,
    captainName: 'Genryusai Shigekuni Yamamoto',
    isAvailable: true,
    maxThreatLevel: 3,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };
  const unavailableSquad = {
    ...availableSquad,
    id: 'unavailable-squad-id',
    number: 2,
    captainName: 'Retsu Unohana',
    isAvailable: false,
  };

  it('returns every persisted squad, including unavailable squads', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValue([availableSquad, unavailableSquad]);
    const prisma = { squad: { findMany } };
    const repository = new SquadsRepository(prisma as never);

    await expect(repository.list()).resolves.toEqual([
      availableSquad,
      unavailableSquad,
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith();
  });

  it('returns the squad matching the requested identity', async () => {
    const findUnique = jest.fn().mockResolvedValue(unavailableSquad);
    const prisma = { squad: { findUnique } };
    const repository = new SquadsRepository(prisma as never);

    await expect(repository.get(unavailableSquad.id)).resolves.toEqual(
      unavailableSquad,
    );
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: unavailableSquad.id },
    });
  });

  it('returns null when no squad matches the requested identity', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const prisma = { squad: { findUnique } };
    const repository = new SquadsRepository(prisma as never);

    await expect(repository.get('missing-squad-id')).resolves.toBeNull();
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'missing-squad-id' },
    });
  });
});

describe('SquadsRepository update and removal', () => {
  const squad = {
    id: 'squad-id',
    number: 13,
    captainName: 'Jushiro Ukitake',
    isAvailable: true,
    maxThreatLevel: 2,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };

  type TransactionClient = {
    squad: {
      updateMany(input: {
        where: { id: string };
        data: Record<string, unknown>;
      }): Promise<{ count: number }>;
      findUnique(input: {
        where: { id: string };
      }): Promise<typeof squad | null>;
    };
  };

  type TransactionCallback = (
    tx: TransactionClient,
  ) => Promise<typeof squad | null>;

  const createTransaction = (prisma: TransactionClient) =>
    jest.fn((callback: TransactionCallback) => callback(prisma));

  it('updates only the supplied fields and returns the updated record', async () => {
    const data = { currentLat: 35.7, isAvailable: false };
    const updatedSquad = { ...squad, ...data };
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue(updatedSquad);
    const prisma = { squad: { updateMany, findUnique } };
    const transaction = createTransaction(prisma);
    const repository = new SquadsRepository({
      ...prisma,
      $transaction: transaction,
    } as never);

    await expect(repository.update(squad.id, data)).resolves.toEqual(
      updatedSquad,
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: squad.id },
      data,
    });
  });

  it('marks the squad unavailable without deleting it', async () => {
    const unavailableSquad = { ...squad, isAvailable: false };
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue(unavailableSquad);
    const prisma = { squad: { updateMany, findUnique } };
    const transaction = createTransaction(prisma);
    const repository = new SquadsRepository({
      ...prisma,
      $transaction: transaction,
    } as never);

    await expect(repository.markUnavailable(squad.id)).resolves.toEqual(
      unavailableSquad,
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: squad.id },
      data: { isAvailable: false },
    });
  });
});
