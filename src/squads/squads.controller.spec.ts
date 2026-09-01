jest.mock('./squads.service', () => ({
  SquadsService: class SquadsService {},
}));

import { SquadsController } from './squads.controller';
import { SquadsService } from './squads.service';
import { DomainExceptionFilter } from '../common/filters/domain-exception.filter';
import { NotFoundError } from '../common/errors/domain-error';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App as SupertestApp } from 'supertest/types';

type SupertestRequest = (app: SupertestApp) => ReturnType<typeof request>;

const requestApp: SupertestRequest = request;

function getHttpServer(app: INestApplication): SupertestApp {
  return app.getHttpServer() as SupertestApp;
}

describe('SquadsController create', () => {
  it('T018: maps POST /squads input to the create service and returns the created squad', async () => {
    const createdSquad = {
      id: 'generated-squad-id',
      number: 1,
      captainName: 'Genryusai Shigekuni Yamamoto',
      isAvailable: true,
      maxThreatLevel: 3,
      currentLat: 35.6762,
      currentLng: 139.6503,
    };
    const create = jest.fn().mockResolvedValue(createdSquad);
    const payload = {
      number: 1,
      captainName: 'Genryusai Shigekuni Yamamoto',
      maxThreatLevel: 3,
      currentLat: 35.6762,
      currentLng: 139.6503,
    };
    const module = await Test.createTestingModule({
      controllers: [SquadsController],
      providers: [{ provide: SquadsService, useValue: { create } }],
    }).compile();
    const app = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    try {
      await requestApp(getHttpServer(app))
        .post('/squads')
        .send(payload)
        .expect(201)
        .expect(createdSquad);
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(payload);
    } finally {
      await app.close();
    }
  });
});

describe('SquadsController read mappings', () => {
  const roster = [
    {
      id: 'available-squad-id',
      number: 1,
      captainName: 'Genryusai Shigekuni Yamamoto',
      isAvailable: true,
      maxThreatLevel: 3,
      currentLat: 35.6762,
      currentLng: 139.6503,
    },
    {
      id: 'unavailable-squad-id',
      number: 2,
      captainName: 'Retsu Unohana',
      isAvailable: false,
      maxThreatLevel: 2,
      currentLat: 35.6895,
      currentLng: 139.6917,
    },
  ];

  async function createApp(service: {
    list: jest.Mock;
    get: jest.Mock;
  }): Promise<INestApplication> {
    const module = await Test.createTestingModule({
      controllers: [SquadsController],
      providers: [{ provide: SquadsService, useValue: service }],
    }).compile();
    const app: INestApplication = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
    return app;
  }

  it('T024: maps GET /squads to the list service and returns the complete roster', async () => {
    const list = jest.fn().mockResolvedValue(roster);
    const get = jest.fn();
    const app = await createApp({ list, get });

    try {
      await requestApp(getHttpServer(app))
        .get('/squads')
        .expect(200)
        .expect(roster);
      expect(list).toHaveBeenCalledTimes(1);
      expect(list).toHaveBeenCalledWith();
      expect(get).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('T024: maps GET /squads/:id to the get service and returns the requested squad', async () => {
    const squad = roster[1];
    const list = jest.fn();
    const get = jest.fn().mockResolvedValue(squad);
    const app = await createApp({ list, get });

    try {
      await requestApp(getHttpServer(app))
        .get(`/squads/${squad.id}`)
        .expect(200)
        .expect(squad);
      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(squad.id);
      expect(list).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('T024: preserves the get mapping for a not-found service outcome', async () => {
    const list = jest.fn();
    const get = jest
      .fn()
      .mockRejectedValue(new NotFoundError('Squad not found'));
    const app = await createApp({ list, get });

    try {
      await requestApp(getHttpServer(app))
        .get('/squads/missing-squad-id')
        .expect(404)
        .expect({
          code: 'NOT_FOUND',
          message: 'Squad not found',
        });
      expect(get).toHaveBeenCalledWith('missing-squad-id');
    } finally {
      await app.close();
    }
  });
});
