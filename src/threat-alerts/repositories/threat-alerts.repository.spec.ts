jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ThreatAlertsRepository } from './threat-alerts.repository';

describe('ThreatAlertsRepository maintenance boundary', () => {
  it('does not persist forbidden status or squad mutations during an update', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue({
      id: 'alert-id',
      threatLevel: 3,
      latitude: 35.9,
      longitude: 139.1,
      status: 'PENDING',
      squadId: null,
    });
    const transaction = jest.fn((callback: (tx: unknown) => unknown) =>
      callback({ threatAlert: { updateMany, findUnique } }),
    );
    const repository = new ThreatAlertsRepository({
      $transaction: transaction,
      threatAlert: { updateMany, findUnique },
    } as never);

    await repository.update('alert-id', {
      threatLevel: 3,
      latitude: 35.9,
      status: 'RESOLVED',
      squadId: 'assigned-squad-id',
    } as never);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'alert-id' },
      data: { threatLevel: 3, latitude: 35.9 },
    });
  });
});
