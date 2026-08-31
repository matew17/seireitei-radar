import { ConflictError } from '../common/errors/domain-error';
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
});
