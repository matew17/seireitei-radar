jest.mock('./squads.service', () => ({
  SquadsService: class SquadsService {},
}));

import { SquadsController } from './squads.controller';
import { SquadsService } from './squads.service';
import { Test } from '@nestjs/testing';
import httpRequest from 'supertest';

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
    await app.init();

    try {
      await httpRequest(app.getHttpServer())
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
