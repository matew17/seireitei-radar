import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '../generated/prisma/client';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearSquads } from './squads-test-utils';
import { configureHttpApplication } from './nest-http-app';

const squadKeys = [
  'id',
  'number',
  'captainName',
  'isAvailable',
  'maxThreatLevel',
  'currentLat',
  'currentLng',
];

function assertRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  expect(typeof value).toBe('object');
  expect(value).not.toBeNull();
}

function assertUnknownArray(value: unknown): asserts value is unknown[] {
  expect(Array.isArray(value)).toBe(true);
}

function assertString(value: unknown): asserts value is string {
  expect(typeof value).toBe('string');
}

function expectSquadResponse(body: unknown): void {
  assertRecord(body);
  expect(typeof body.id).toBe('string');
  expect(typeof body.number).toBe('number');
  expect(typeof body.captainName).toBe('string');
  expect(typeof body.isAvailable).toBe('boolean');
  expect(typeof body.maxThreatLevel).toBe('number');
  expect(typeof body.currentLat).toBe('number');
  expect(typeof body.currentLng).toBe('number');
  expect(Object.keys(body).sort()).toEqual([...squadKeys].sort());
}

function expectErrorResponse(body: unknown): void {
  assertRecord(body);
  expect(typeof body.code).toBe('string');
  expect(typeof body.message).toBe('string');
  expect(Object.keys(body).sort()).toEqual(['code', 'message']);
}

describe('Squad API OpenAPI contract (T033)', () => {
  let app: INestApplication<App>;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureHttpApplication(app);
    await app.init();
  });

  beforeEach(() => clearSquads(prisma));

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('T033: returns the Squad schema for create, list, get, update, and remove responses', async () => {
    const created = await request(app.getHttpServer())
      .post('/squads')
      .send({
        number: 1,
        captainName: 'Retsu Unohana',
        maxThreatLevel: 2,
        currentLat: 35.6,
        currentLng: 139.6,
      })
      .expect(201);
    expectSquadResponse(created.body);

    assertRecord(created.body);
    assertString(created.body.id);
    const id = created.body.id;
    const unavailable = await request(app.getHttpServer())
      .post('/squads')
      .send({
        number: 2,
        captainName: 'Jushiro Ukitake',
        isAvailable: false,
        maxThreatLevel: 1,
        currentLat: 35.7,
        currentLng: 139.7,
      })
      .expect(201);
    expectSquadResponse(unavailable.body);

    const found = await request(app.getHttpServer())
      .get(`/squads/${id}`)
      .expect(200);
    expectSquadResponse(found.body);

    const updated = await request(app.getHttpServer())
      .patch(`/squads/${id}`)
      .send({ captainName: 'Shunsui Kyoraku' })
      .expect(200);
    expectSquadResponse(updated.body);

    const removed = await request(app.getHttpServer())
      .delete(`/squads/${id}`)
      .expect(200);
    expectSquadResponse(removed.body);

    const listed = await request(app.getHttpServer())
      .get('/squads')
      .expect(200);
    assertUnknownArray(listed.body);
    expect(listed.body).toHaveLength(2);
    for (const squad of listed.body) {
      expectSquadResponse(squad);
    }
    expect(listed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id,
          number: 1,
          captainName: 'Shunsui Kyoraku',
          isAvailable: false,
          maxThreatLevel: 2,
          currentLat: 35.6,
          currentLng: 139.6,
        }),
        expect.objectContaining({
          number: 2,
          captainName: 'Jushiro Ukitake',
          isAvailable: false,
        }),
      ]),
    );
  });

  it('T033: returns the ErrorResponse schema for every documented error response', async () => {
    const missing = '00000000-0000-0000-0000-000000000000';
    const existing = await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Retsu Unohana',
        maxThreatLevel: 2,
        currentLat: 1,
        currentLng: 1,
      },
    });
    const other = await prisma.squad.create({
      data: {
        number: 2,
        captainName: 'Shunsui Kyoraku',
        maxThreatLevel: 2,
        currentLat: 1,
        currentLng: 1,
      },
    });
    const duplicateCreate = request(app.getHttpServer())
      .post('/squads')
      .send({
        number: 1,
        captainName: 'Shunsui Kyoraku',
        maxThreatLevel: 2,
        currentLat: 1,
        currentLng: 1,
      })
      .expect(409);
    for (const response of [
      await duplicateCreate,
      await request(app.getHttpServer()).get(`/squads/${missing}`).expect(404),
      await request(app.getHttpServer())
        .patch(`/squads/${missing}`)
        .send({ captainName: 'Rukia Kuchiki' })
        .expect(404),
      await request(app.getHttpServer())
        .patch(`/squads/${existing.id}`)
        .send({ maxThreatLevel: 4 })
        .expect(400),
      await request(app.getHttpServer())
        .patch(`/squads/${other.id}`)
        .send({ number: 1 })
        .expect(409),
      await request(app.getHttpServer())
        .delete(`/squads/${missing}`)
        .expect(404),
      await request(app.getHttpServer())
        .post('/squads')
        .send({
          number: 1,
          captainName: '',
          maxThreatLevel: 2,
          currentLat: 1,
          currentLng: 1,
        })
        .expect(400),
    ]) {
      expectErrorResponse(response.body);
    }
  });

  it('T033: returns the ErrorResponse schema for PATCH invalid input', async () => {
    const squad = await prisma.squad.create({
      data: {
        number: 3,
        captainName: 'Byakuya Kuchiki',
        maxThreatLevel: 2,
        currentLat: 1,
        currentLng: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/squads/${squad.id}`)
      .send({ captainName: '' })
      .expect(400);

    expectErrorResponse(response.body);
  });

  it('T033: returns the ErrorResponse schema for PATCH duplicate squad number', async () => {
    const squad = await prisma.squad.create({
      data: {
        number: 3,
        captainName: 'Byakuya Kuchiki',
        maxThreatLevel: 2,
        currentLat: 1,
        currentLng: 1,
      },
    });

    await prisma.squad.create({
      data: {
        number: 4,
        captainName: 'Shunsui Kyoraku',
        maxThreatLevel: 2,
        currentLat: 1,
        currentLng: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/squads/${squad.id}`)
      .send({ number: 4 })
      .expect(409);

    expectErrorResponse(response.body);
  });
});
