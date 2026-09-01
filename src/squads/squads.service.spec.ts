import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import { SquadsRepository } from './squads.repository';
import { SquadsService } from './squads.service';

jest.mock('./squads.repository', () => ({
  SquadsRepository: class SquadsRepository {},
}));

describe('SquadsService create', () => {
  const squadInput = {
    number: 1,
    captainName: 'Genryusai Shigekuni Yamamoto',
    maxThreatLevel: 3,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };

  const squad = {
    id: 'squad-id',
    ...squadInput,
    isAvailable: true,
  };

  type SquadCreator = {
    create(data: typeof squadInput): Promise<typeof squad>;
  };

  let create: jest.MockedFunction<SquadCreator['create']>;
  let service: SquadsService;

  beforeEach(() => {
    create = jest.fn();
    service = new SquadsService({ create } as unknown as SquadsRepository);
  });

  it('creates and returns a squad with its persisted operational values', async () => {
    create.mockResolvedValue(squad);

    await expect(service.create(squadInput)).resolves.toEqual(squad);
    expect(create).toHaveBeenCalledWith(squadInput);
  });

  it('BR-02 translates a duplicate squad number into a client-safe conflict', async () => {
    const persistenceMessage =
      'Unique constraint failed on the fields: (`number`) for Squad';
    create.mockRejectedValue(
      Object.assign(new Error(persistenceMessage), { code: 'P2002' }),
    );

    let thrown: unknown;
    try {
      await service.create(squadInput);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictError);
    expect(thrown).toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'Squad number already exists',
    });
    expect((thrown as Error).message).not.toContain(persistenceMessage);
  });

  it('BR-02 translates a Prisma P2002 error using its code rather than exposing persistence details', async () => {
    create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['number'] },
      message: 'Prisma internal unique constraint details',
    });

    let thrown: unknown;
    try {
      await service.create(squadInput);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'Squad number already exists',
    });
    expect((thrown as Error).message).not.toContain(
      'Prisma internal unique constraint details',
    );
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('SquadsService roster and lookup', () => {
  const availableSquad = {
    id: 'available-squad-id',
    number: 1,
    captainName: 'Genryusai Shigekuni Yamamoto',
    isAvailable: true,
    maxThreatLevel: 3,
    currentLat: 35.6762,
    currentLng: 139.6503,
  };
  const unavailableSquad = {
    ...availableSquad,
    id: 'unavailable-squad-id',
    number: 2,
    captainName: 'Retsu Unohana',
    isAvailable: false,
  };

  type SquadRecord = typeof availableSquad;

  type RosterReader = {
    list(): Promise<SquadRecord[]>;
    get(id: string): Promise<SquadRecord | null>;
  };

  let list: jest.MockedFunction<RosterReader['list']>;
  let get: jest.MockedFunction<RosterReader['get']>;
  let service: RosterReader;

  beforeEach(() => {
    list = jest.fn();
    get = jest.fn();
    service = new SquadsService({
      list,
      get,
    } as unknown as SquadsRepository);
  });

  it('returns the complete roster, including unavailable squads', async () => {
    list.mockResolvedValue([availableSquad, unavailableSquad]);

    await expect(service.list()).resolves.toEqual([
      availableSquad,
      unavailableSquad,
    ]);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('returns the requested squad by identity', async () => {
    get.mockResolvedValue(unavailableSquad);

    await expect(service.get(unavailableSquad.id)).resolves.toEqual(
      unavailableSquad,
    );
    expect(get).toHaveBeenCalledWith(unavailableSquad.id);
  });

  it('reports a client-safe not-found outcome for an unknown identity', async () => {
    get.mockResolvedValue(null);

    let thrown: unknown;
    try {
      await service.get('missing-squad-id');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NotFoundError);
    expect(thrown).toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
    expect(thrown).toHaveProperty('message', expect.any(String));
    expect((thrown as Error).message).not.toContain('Prisma');
    expect(get).toHaveBeenCalledWith('missing-squad-id');
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('SquadsService update and removal', () => {
  const existingSquad = {
    id: 'existing-squad-id',
    number: 11,
    captainName: 'Shunsui Kyoraku',
    isAvailable: true,
    maxThreatLevel: 3,
    currentLat: 35.6895,
    currentLng: 139.6917,
  };

  type SquadUpdater = {
    update(
      id: string,
      data: Record<string, unknown>,
    ): Promise<typeof existingSquad | null>;
    markUnavailable(id: string): Promise<typeof existingSquad | null>;
  };

  type MutableSquadsService = SquadsService & {
    update(
      id: string,
      data: Record<string, unknown>,
    ): Promise<typeof existingSquad>;
    remove(id: string): Promise<typeof existingSquad>;
  };

  let update: jest.MockedFunction<SquadUpdater['update']>;
  let markUnavailable: jest.MockedFunction<SquadUpdater['markUnavailable']>;
  let service: MutableSquadsService;

  beforeEach(() => {
    update = jest.fn();
    markUnavailable = jest.fn();
    service = new SquadsService({
      update,
      markUnavailable,
    } as unknown as SquadsRepository);
  });

  it('T028: preserves omitted fields when partially updating a squad', async () => {
    const patch = {
      captainName: 'Soi Fon',
      currentLat: 34.6937,
    };
    const updatedSquad = {
      ...existingSquad,
      ...patch,
    };
    update.mockResolvedValue(updatedSquad);

    await expect(service.update(existingSquad.id, patch)).resolves.toEqual(
      updatedSquad,
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(existingSquad.id, patch);
  });

  it('T028: reports a client-safe not-found outcome when updating a missing squad', async () => {
    const patch = { captainName: 'Soi Fon' };
    update.mockResolvedValue(null);

    let thrown: unknown;
    try {
      await service.update('missing-squad-id', patch);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NotFoundError);
    expect(thrown).toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
    expect(thrown).toHaveProperty('message', expect.any(String));
    expect((thrown as Error).message).not.toContain('Prisma');
    expect(update).toHaveBeenCalledWith('missing-squad-id', patch);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('T028: marks a squad unavailable when removing it', async () => {
    const removedSquad = {
      ...existingSquad,
      isAvailable: false,
    };
    markUnavailable.mockResolvedValue(removedSquad);

    await expect(service.remove(existingSquad.id)).resolves.toEqual(
      removedSquad,
    );
    expect(markUnavailable).toHaveBeenCalledTimes(1);
    expect(markUnavailable).toHaveBeenCalledWith(existingSquad.id);
  });

  it('T028: reports a client-safe not-found outcome when removing a missing squad', async () => {
    markUnavailable.mockResolvedValue(null);

    let thrown: unknown;
    try {
      await service.remove('missing-squad-id');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NotFoundError);
    expect(thrown).toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
    expect(thrown).toHaveProperty('message', expect.any(String));
    expect((thrown as Error).message).not.toContain('Prisma');
    expect(markUnavailable).toHaveBeenCalledWith('missing-squad-id');
    expect(markUnavailable).toHaveBeenCalledTimes(1);
  });

});
