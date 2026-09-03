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

type SquadResponse = {
  id: string;
  number: number;
  captainName: string;
  isAvailable: boolean;
  maxThreatLevel: number;
  currentLat: number;
  currentLng: number;
};

type ThreatAlertWithCandidateSquadsResponse = ThreatAlertResponse & {
  candidateSquads: SquadResponse[];
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

function assertSquadResponse(body: unknown): asserts body is SquadResponse {
  assertRecord(body);
  expect(typeof body.id).toBe('string');
  expect(typeof body.number).toBe('number');
  expect(typeof body.captainName).toBe('string');
  expect(typeof body.isAvailable).toBe('boolean');
  expect(typeof body.maxThreatLevel).toBe('number');
  expect(typeof body.currentLat).toBe('number');
  expect(typeof body.currentLng).toBe('number');
  expect(Object.keys(body).sort()).toEqual(
    [
      'captainName',
      'currentLat',
      'currentLng',
      'id',
      'isAvailable',
      'maxThreatLevel',
      'number',
    ].sort(),
  );
}

function assertArray(value: unknown): asserts value is unknown[] {
  expect(Array.isArray(value)).toBe(true);
}

function assertValidationErrorResponse(
  body: unknown,
): asserts body is { code: 'VALIDATION_ERROR' } {
  assertRecord(body);
  expect(body.code).toBe('VALIDATION_ERROR');
}

function assertThreatAlertWithCandidateSquadsResponse(
  body: unknown,
): asserts body is ThreatAlertWithCandidateSquadsResponse {
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
      'candidateSquads',
      'createdAt',
      'id',
      'latitude',
      'longitude',
      'squadId',
      'status',
      'threatLevel',
    ].sort(),
  );
  const candidateSquads = body.candidateSquads;
  assertArray(candidateSquads);
  candidateSquads.forEach((candidateSquad) => {
    assertSquadResponse(candidateSquad);
  });
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

  it('T003: returns the ThreatAlert schema with candidateSquads for a severity-submitting update', async () => {
    const eligible = await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Eligible',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35,
        currentLng: 139,
      },
    });
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    const updated = await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({ threatLevel: 3, latitude: 35.9 })
      .expect(200);

    assertThreatAlertWithCandidateSquadsResponse(updated.body);
    expect(updated.body).toMatchObject({
      id: alert.id,
      threatLevel: 3,
      latitude: 35.9,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
      candidateSquads: [eligible],
    });
  });

  it('BR-03/BR-04: assignment success returns the established alert schema without candidateSquads', async () => {
    const squad = await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Eligible',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35,
        currentLng: 139,
      },
    });
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 3, latitude: 35.3, longitude: 139.3 },
    });
    const response = await request(app.getHttpServer())
      .post(`/threat-alerts/${alert.id}/assign`)
      .expect(200);

    assertThreatAlertResponse(response.body);
    expect(response.body).toMatchObject({
      id: alert.id,
      threatLevel: 3,
      status: 'ASSIGNED',
      squadId: squad.id,
    });
    expect(response.body).not.toHaveProperty('candidateSquads');
  });

  it('BR-07: assignment of a missing alert returns the safe not-found contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/threat-alerts/00000000-0000-4000-8000-000000000000/assign')
      .expect(404);
    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: 'ThreatAlert not found',
    });
    expect(JSON.stringify(response.body)).not.toMatch(/prisma|database|sql/i);
  });

  it('T001: assignment with a malformed alert id returns a safe 400 validation error', async () => {
    const response = await request(app.getHttpServer())
      .post('/threat-alerts/not-a-uuid/assign')
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    assertValidationErrorResponse(response.body);
    expect(JSON.stringify(response.body)).not.toMatch(/prisma|database|sql/i);
  });

  it('T003: returns the ThreatAlert schema without candidateSquads for a location-only update', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    const updated = await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({ latitude: 35.9 })
      .expect(200);

    assertThreatAlertResponse(updated.body);
    expect(updated.body).toMatchObject({
      id: alert.id,
      threatLevel: 2,
      latitude: 35.9,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
    });
  });

  it('T003: returns the ThreatAlert schema with an empty candidateSquads collection for create', async () => {
    await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Unavailable',
        isAvailable: false,
        maxThreatLevel: 3,
        currentLat: 35,
        currentLng: 139,
      },
    });

    const created = await request(app.getHttpServer())
      .post('/threat-alerts')
      .send({ threatLevel: 3, latitude: 35.1, longitude: 139.1 })
      .expect(201);

    assertThreatAlertWithCandidateSquadsResponse(created.body);
    expect(created.body).toMatchObject({
      threatLevel: 3,
      status: 'PENDING',
      squadId: null,
      candidateSquads: [],
    });
  });

  it('T003: returns the ThreatAlert schema with candidateSquads for create', async () => {
    const eligible = await prisma.squad.create({
      data: {
        number: 2,
        captainName: 'Eligible',
        isAvailable: true,
        maxThreatLevel: 3,
        currentLat: 35,
        currentLng: 139,
      },
    });

    const created = await request(app.getHttpServer())
      .post('/threat-alerts')
      .send({ threatLevel: 2, latitude: 35.1, longitude: 139.1 })
      .expect(201);

    assertThreatAlertWithCandidateSquadsResponse(created.body);
    expect(created.body).toMatchObject({
      threatLevel: 2,
      status: 'PENDING',
      squadId: null,
      candidateSquads: [eligible],
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
