import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Squad } from '../generated/prisma/client';
import { PrismaClient } from '../generated/prisma/client';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearSquads, seedSquads } from './squads-test-utils';

type RosterSquad = Pick<
  Squad,
  | 'id'
  | 'number'
  | 'captainName'
  | 'isAvailable'
  | 'maxThreatLevel'
  | 'currentLat'
  | 'currentLng'
>;

function isRosterSquad(value: unknown): value is RosterSquad {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const squad = value as Record<string, unknown>;

  return (
    typeof squad.id === 'string' &&
    typeof squad.number === 'number' &&
    typeof squad.captainName === 'string' &&
    typeof squad.isAvailable === 'boolean' &&
    typeof squad.maxThreatLevel === 'number' &&
    typeof squad.currentLat === 'number' &&
    typeof squad.currentLng === 'number'
  );
}

function parseRosterResponse(body: unknown): RosterSquad[] {
  if (!Array.isArray(body) || !body.every(isRosterSquad)) {
    throw new Error('Expected GET /squads to return an array of squads');
  }

  return body;
}

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

  it('BR-02 rejects a duplicate squad number through the PostgreSQL unique constraint', async () => {
    await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    });

    await expect(
      prisma.squad.create({
        data: {
          number: 1,
          captainName: 'Shunsui Kyoraku',
          maxThreatLevel: 3,
          currentLat: 35.6762,
          currentLng: 139.6503,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});

describe('Create squad API (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await clearSquads(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a squad and returns its stored operational values', async () => {
    const squad = {
      number: 1,
      captainName: 'Genryusai Shigekuni Yamamoto',
      isAvailable: false,
      maxThreatLevel: 3,
      currentLat: 35.6762,
      currentLng: 139.6503,
    };

    const response = await request(app.getHttpServer())
      .post('/squads')
      .send(squad)
      .expect(201);

    expect(response.body).toMatchObject(squad);
    expect(response.body).toHaveProperty('id');
  });

  it('defaults isAvailable to true when it is omitted', async () => {
    const response = await request(app.getHttpServer())
      .post('/squads')
      .send({
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      })
      .expect(201);

    expect(response.body).toMatchObject({ isAvailable: true });
  });

  it('BR-02 rejects a create request with a duplicate squad number', async () => {
    await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    });

    await request(app.getHttpServer())
      .post('/squads')
      .send({
        number: 1,
        captainName: 'Shunsui Kyoraku',
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      })
      .expect(409);

    await expect(prisma.squad.count({ where: { number: 1 } })).resolves.toBe(1);
  });

  it('BR-03 rejects a create request with an invalid maxThreatLevel', async () => {
    await request(app.getHttpServer())
      .post('/squads')
      .send({
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        maxThreatLevel: 4,
        currentLat: 35.6762,
        currentLng: 139.6503,
      })
      .expect(400);

    await expect(prisma.squad.count()).resolves.toBe(0);
  });
});

describe('List squads API (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await clearSquads(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns all squads in the roster, including unavailable squads', async () => {
    const squads = await seedSquads(prisma, [
      {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
      {
        number: 2,
        captainName: 'Retsu Unohana',
        isAvailable: false,
        maxThreatLevel: 2,
        currentLat: 35.6895,
        currentLng: 139.6917,
      },
    ]);

    const { body } = (await request(app.getHttpServer())
      .get('/squads')
      .expect(200)) as { body: unknown };

    const roster = parseRosterResponse(body);

    expect(roster).toHaveLength(2);
    expect(roster).toEqual(expect.arrayContaining(squads));
    expect(roster.some(({ isAvailable }) => !isAvailable)).toBe(true);
  });
});

describe('Get squad API (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await clearSquads(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns a squad when the requested identity exists', async () => {
    const [squad] = await seedSquads(prisma, [
      {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    ]);

    const { body } = (await request(app.getHttpServer())
      .get(`/squads/${squad.id}`)
      .expect(200)) as { body: unknown };

    expect(body).toMatchObject(squad);
  });

  it('T024: maps a missing GET /squads/:id through the production domain exception filter', async () => {
    const { body } = (await request(app.getHttpServer())
      .get('/squads/00000000-0000-0000-0000-000000000000')
      .expect(404)) as { body: unknown };

    expect(body).toEqual({
      code: 'NOT_FOUND',
      message: 'Squad not found',
    });
  });
});

describe('Update squad API (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await clearSquads(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('T025: partially updates a squad while preserving omitted fields', async () => {
    const [squad] = await seedSquads(prisma, [
      {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: false,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    ]);

    const response = await request(app.getHttpServer())
      .patch(`/squads/${squad.id}`)
      .send({
        captainName: 'Shunsui Kyoraku',
        currentLat: 35.6895,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: squad.id,
      number: 1,
      captainName: 'Shunsui Kyoraku',
      isAvailable: false,
      maxThreatLevel: 3,
      currentLat: 35.6895,
      currentLng: 139.6503,
    });

    await expect(
      prisma.squad.findUnique({ where: { id: squad.id } }),
    ).resolves.toMatchObject({
      number: 1,
      captainName: 'Shunsui Kyoraku',
      isAvailable: false,
      maxThreatLevel: 3,
      currentLat: 35.6895,
      currentLng: 139.6503,
    });
  });

  it('BR-02 (T026): rejects a patch request that reuses another squad number and preserves the stored squad', async () => {
    const [squad, conflictingSquad] = await seedSquads(prisma, [
      {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: false,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
      {
        number: 2,
        captainName: 'Shunsui Kyoraku',
        isAvailable: true,
        maxThreatLevel: 2,
        currentLat: 35.6895,
        currentLng: 139.6917,
      },
    ]);

    await request(app.getHttpServer())
      .patch(`/squads/${squad.id}`)
      .send({ number: conflictingSquad.number })
      .expect(409);

    await expect(
      prisma.squad.findUnique({ where: { id: squad.id } }),
    ).resolves.toMatchObject(squad);
  });

  it('BR-03 (T026): rejects a patch request with an invalid maxThreatLevel and preserves the stored squad', async () => {
    const [squad] = await seedSquads(prisma, [
      {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: false,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    ]);

    await request(app.getHttpServer())
      .patch(`/squads/${squad.id}`)
      .send({ maxThreatLevel: 4 })
      .expect(400);

    await expect(
      prisma.squad.findUnique({ where: { id: squad.id } }),
    ).resolves.toMatchObject(squad);
  });

  it('T027: marks a deleted squad unavailable and keeps it in the roster', async () => {
    const [squad] = await seedSquads(prisma, [
      {
        number: 1,
        captainName: 'Genryusai Shigekuni Yamamoto',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35.6762,
        currentLng: 139.6503,
      },
    ]);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/squads/${squad.id}`)
      .expect(200);

    expect(deleteResponse.body).toMatchObject({
      id: squad.id,
      isAvailable: false,
    });

    const { body } = (await request(app.getHttpServer())
      .get('/squads')
      .expect(200)) as { body: unknown };
    const roster = parseRosterResponse(body);

    expect(roster).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: squad.id,
          isAvailable: false,
        }),
      ]),
    );
  });
});
