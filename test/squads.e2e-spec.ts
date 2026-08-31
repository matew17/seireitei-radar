import { PrismaClient } from '../generated/prisma/client';
import { clearSquads } from './squads-test-utils';

describe('Squad database constraints (e2e)', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await clearSquads(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('BR-03 rejects an invalid maxThreatLevel through the PostgreSQL check constraint', async () => {
    await expect(
      prisma.squad.create({
        data: {
          number: 1,
          captainName: 'Genryusai Shigekuni Yamamoto',
          maxThreatLevel: 4,
          currentLat: 35.6762,
          currentLng: 139.6503,
        },
      }),
    ).rejects.toThrow('Squad_maxThreatLevel_check');
  });
});
