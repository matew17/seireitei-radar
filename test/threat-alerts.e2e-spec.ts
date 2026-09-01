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
});
