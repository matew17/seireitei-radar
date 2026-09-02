import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '../generated/prisma/client';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ThreatAlertsRepository } from '../src/threat-alerts/repositories/threat-alerts.repository';

describe('ThreatAlert creation (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;
  let threatAlertsRepository: ThreatAlertsRepository;

  beforeAll(async () => {
    await prisma.$connect();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    threatAlertsRepository = app.get(ThreatAlertsRepository);
  });

  beforeEach(async () => {
    await prisma.threatAlert.deleteMany();
    await prisma.squad.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('BR-01: identifies every available squad capable of handling the reported level', async () => {
    const eligible = await prisma.squad.create({
      data: {
        number: 1,
        captainName: 'Eligible',
        isAvailable: true,
        maxThreatLevel: 2,
        currentLat: 35,
        currentLng: 139,
      },
    });
    await prisma.squad.create({
      data: {
        number: 2,
        captainName: 'Unavailable',
        isAvailable: false,
        maxThreatLevel: 3,
        currentLat: 35,
        currentLng: 139,
      },
    });
    await prisma.squad.create({
      data: {
        number: 3,
        captainName: 'Insufficient',
        isAvailable: true,
        maxThreatLevel: 1,
        currentLat: 35,
        currentLng: 139,
      },
    });

    await expect(threatAlertsRepository.findEligibleSquads(2)).resolves.toEqual(
      [eligible],
    );

    const response = await request(app.getHttpServer())
      .post('/threat-alerts')
      .send({ threatLevel: 2, latitude: 35.1, longitude: 139.1 })
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'PENDING',
      squadId: null,
      threatLevel: 2,
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
  });

  it('BR-04: creates valid levels as pending and unassigned alerts', async () => {
    for (const threatLevel of [1, 2, 3]) {
      const response = await request(app.getHttpServer())
        .post('/threat-alerts')
        .send({ threatLevel, latitude: 35, longitude: 139 })
        .expect(201);

      expect(response.body).toMatchObject({
        threatLevel,
        status: 'PENDING',
        squadId: null,
      });
      const body: unknown = response.body;
      expect(typeof body).toBe('object');
      expect(body).not.toBeNull();
      expect(typeof (body as { id: unknown }).id).toBe('string');
    }
    await expect(prisma.threatAlert.count()).resolves.toBe(3);
  });

  it('BR-04: rejects an invalid level without storing an alert', async () => {
    await request(app.getHttpServer())
      .post('/threat-alerts')
      .send({ threatLevel: 4, latitude: 35, longitude: 139 })
      .expect(400);

    await expect(prisma.threatAlert.count()).resolves.toBe(0);
  });

  it('BR-04: rejects invalid levels through the PostgreSQL check constraint', async () => {
    await expect(
      prisma.threatAlert.create({
        data: { threatLevel: 4, latitude: 35, longitude: 139 },
      }),
    ).rejects.toThrow('ThreatAlert_threatLevel_check');
  });

  it('BR-04: rejects invalid updated threat levels through the PostgreSQL check constraint', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    await expect(
      threatAlertsRepository.update(alert.id, { threatLevel: 4 }),
    ).rejects.toThrow('ThreatAlert_threatLevel_check');

    await expect(
      prisma.threatAlert.findUnique({ where: { id: alert.id } }),
    ).resolves.toMatchObject({
      threatLevel: 2,
      latitude: 35.3,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
    });
  });

  it('BR-04: rejects an invalid threat level in a direct PostgreSQL update and preserves the row', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    await expect(
      prisma.threatAlert.update({
        where: { id: alert.id },
        data: { threatLevel: 0 },
      }),
    ).rejects.toThrow('ThreatAlert_threatLevel_check');

    await expect(
      prisma.threatAlert.findUnique({ where: { id: alert.id } }),
    ).resolves.toMatchObject({
      threatLevel: 2,
      latitude: 35.3,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
    });
  });

  it('returns every alert in the list, including resolved alerts', async () => {
    const pending = await prisma.threatAlert.create({
      data: { threatLevel: 1, latitude: 35.1, longitude: 139.1 },
    });
    const resolved = await prisma.threatAlert.create({
      data: {
        threatLevel: 3,
        latitude: 35.2,
        longitude: 139.2,
        status: 'RESOLVED',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/threat-alerts')
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pending.id,
          threatLevel: 1,
          latitude: 35.1,
          longitude: 139.1,
          status: 'PENDING',
          squadId: null,
          createdAt: pending.createdAt.toISOString(),
        }),
        expect.objectContaining({
          id: resolved.id,
          threatLevel: 3,
          latitude: 35.2,
          longitude: 139.2,
          status: 'RESOLVED',
          squadId: null,
          createdAt: resolved.createdAt.toISOString(),
        }),
      ]),
    );
  });

  it('returns an alert with its stored details by identity', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    await request(app.getHttpServer())
      .get(`/threat-alerts/${alert.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          id: alert.id,
          threatLevel: 2,
          latitude: 35.3,
          longitude: 139.3,
          status: 'PENDING',
          squadId: null,
          createdAt: alert.createdAt.toISOString(),
        });
      });
  });

  it('returns a safe shared not-found response for an absent identity', async () => {
    const response = await request(app.getHttpServer())
      .get('/threat-alerts/does-not-exist')
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'NOT_FOUND',
      }),
    );
    const responseBody = response.body as { message: unknown };
    expect(typeof responseBody.message).toBe('string');
    expect(JSON.stringify(response.body)).not.toMatch(/prisma|database|sql/i);
  });

  it('updates only the supplied threat level and coordinates while preserving omitted details', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 1, latitude: 35.3, longitude: 139.3 },
    });

    const response = await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({ threatLevel: 3, latitude: 35.9 })
      .expect(200);

    expect(response.body).toMatchObject({
      id: alert.id,
      threatLevel: 3,
      latitude: 35.9,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
    });
    await expect(
      prisma.threatAlert.findUnique({ where: { id: alert.id } }),
    ).resolves.toMatchObject({
      threatLevel: 3,
      latitude: 35.9,
      longitude: 139.3,
      status: 'PENDING',
      squadId: null,
    });
  });

  it('rejects an empty update and fields outside threat level and coordinates', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({ status: 'RESOLVED' })
      .expect(400);

    await expect(
      prisma.threatAlert.findUnique({ where: { id: alert.id } }),
    ).resolves.toMatchObject({
      threatLevel: 2,
      latitude: 35.3,
      longitude: 139.3,
      status: 'PENDING',
    });
  });

  it('rejects an invalid updated threat level without changing the alert', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    const response = await request(app.getHttpServer())
      .patch(`/threat-alerts/${alert.id}`)
      .send({ threatLevel: 4 })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    await expect(
      prisma.threatAlert.findUnique({ where: { id: alert.id } }),
    ).resolves.toMatchObject({
      threatLevel: 2,
      latitude: 35.3,
      longitude: 139.3,
    });
  });

  it('marks an alert resolved while retaining it in the list', async () => {
    const alert = await prisma.threatAlert.create({
      data: { threatLevel: 2, latitude: 35.3, longitude: 139.3 },
    });

    await request(app.getHttpServer())
      .delete(`/threat-alerts/${alert.id}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ id: alert.id, status: 'RESOLVED' }),
      );

    const list = await request(app.getHttpServer())
      .get('/threat-alerts')
      .expect(200);
    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: alert.id, status: 'RESOLVED' }),
      ]),
    );
    await expect(
      prisma.threatAlert.findUnique({ where: { id: alert.id } }),
    ).resolves.toMatchObject({
      status: 'RESOLVED',
    });
  });

  it('returns not found when updating or removing an absent alert', async () => {
    for (const method of ['patch', 'delete'] as const) {
      const response = await request(app.getHttpServer())
        [method]('/threat-alerts/does-not-exist')
        .send(method === 'patch' ? { threatLevel: 2 } : undefined)
        .expect(404);

      expect(response.body).toEqual(
        expect.objectContaining({ code: 'NOT_FOUND' }),
      );
      expect(JSON.stringify(response.body)).not.toMatch(/prisma|database|sql/i);
    }
  });
});
