jest.mock('../prisma/prisma.service', () => ({
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
