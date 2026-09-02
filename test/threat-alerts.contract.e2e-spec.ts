import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '../generated/prisma/client';
import { App } from 'supertest/types';
import request from 'supertest';
import { configureHttpApplication } from './nest-http-app';

type ThreatAlertResponse = {
  id: string;
  threatLevel: number;
  latitude: number;
  longitude: number;
  status: string;
  squadId: string | null;
  createdAt: string;
};

function assertRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  expect(typeof value).toBe('object');
  expect(value).not.toBeNull();
}

function assertThreatAlertResponse(
  body: unknown,
): asserts body is ThreatAlertResponse {
  assertRecord(body);
  expect(typeof body.id).toBe('string');
  expect(typeof body.threatLevel).toBe('number');
  expect(typeof body.latitude).toBe('number');
  expect(typeof body.longitude).toBe('number');
  expect(typeof body.status).toBe('string');
  expect(body.squadId === null || typeof body.squadId === 'string').toBe(true);
  expect(typeof body.createdAt).toBe('string');
  expect(Object.keys(body).sort()).toEqual(
    [
      'createdAt',
      'id',
      'latitude',
      'longitude',
      'squadId',
      'status',
      'threatLevel',
    ].sort(),
  );
}

describe('ThreatAlert API OpenAPI contract (T003)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;

  beforeAll(async () => {
    await prisma.$connect();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureHttpApplication(app);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.threatAlert.deleteMany();
    await prisma.squad.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('T003: returns the ThreatAlert schema for a partial update while preserving omitted fields', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    const updated = await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({ threatLevel: 3, latitude: 35.9 })
      .expect(200);

    assertThreatAlertResponse(updated.body);
    expect(updated.body).toMatchObject({
      id: alert.id,
      threatLevel: 3,
      latitude: 35.9,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
    });
  });

  it('T003: returns the ThreatAlert schema when removal marks the alert resolved', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    const removed = await request(app.getHttpServer())
      .delete(`/threat-alerts/${alert.id}`)
      .expect(200);

    assertThreatAlertResponse(removed.body);
    expect(removed.body).toMatchObject({
      id: alert.id,
      threatLevel: 2,
      latitude: 35.3,
      longitude: 139.3,
      status: 'RESOLVED',
      squadId: null,
    });

    const list = await request(app.getHttpServer())
      .get('/threat-alerts')
      .expect(200);

    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: alert.id,
          status: 'RESOLVED',
        }),
      ]),
    );
  });
});
