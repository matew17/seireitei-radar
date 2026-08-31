import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '../generated/prisma/client';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
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
