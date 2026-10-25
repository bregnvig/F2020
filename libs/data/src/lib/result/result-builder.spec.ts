import { describe, expect, it } from 'vitest';
import { IDriver, IDriverQualifying, IDriverRaceResult, IFastestLap, IPitStop, IQualifyResult, IRaceResult, ITeam } from '../model';
import { buildInterimResult, buildResult } from './result-builder';

const driver = (driverId: string) => ({ driverId, code: driverId.toUpperCase() }) as IDriver;

const basis = { season: 2026, round: 1, name: 'Australian Grand Prix', countryCode: 'AU', location: { lat: -37.8497, lng: 144.968 } } as IRaceResult;

/** In the order of the qualifying. RUS starts from the pit lane */
const qualifying: [string, number][] = [
  ['ver', 79_000],
  ['had', 79_100],
  ['nor', 79_200],
  ['pia', 79_300],
  ['lec', 79_400],
  ['ham', 79_500],
  ['ant', 79_600],
  ['rus', 79_700],
  ['alo', 79_800],
  ['str', 79_900],
];

const qualify: IQualifyResult = {
  ...basis,
  results: qualifying.map(([driverId, duration], index): IDriverQualifying => ({ driver: driver(driverId), position: index + 1, duration })),
};

/** [driver, grid, status, fastest lap rank]. ALO, STR and HAM did not finish, in that order from the back */
const finishing: [string, number, string, number?][] = [
  ['had', 2, 'Gennemført', 2],
  ['ver', 1, 'Gennemført', 3],
  ['lec', 5, 'Gennemført', 1],
  ['nor', 3, 'Gennemført'],
  ['pia', 4, 'Gennemført'],
  ['ant', 7, 'Gennemført'],
  ['rus', 0, 'Gennemført'],
  ['ham', 6, 'Ulykke'],
  ['str', 10, 'Motor'],
  ['alo', 9, 'Ulykke'],
];

const race: IRaceResult = {
  ...basis,
  results: finishing.map(([driverId, grid, status, rank], index): IDriverRaceResult => ({
    driver: driver(driverId),
    position: index + 1,
    points: 0,
    grid,
    status,
    fastestLap: rank ? ({ rank } as IFastestLap) : undefined,
  })),
} as IRaceResult;

const team = (constructorId: string, drivers: string[]) => ({ constructorId, name: constructorId, drivers }) as ITeam;

const mercedes = team('mercedes', ['rus', 'ant']);

const pitStop = (constructorId: string, duration: number) => ({ team: team(constructorId, []), duration, lap: 20 }) as IPitStop;

const pitStops = [pitStop('mclaren', 2_500), pitStop('ferrari', 4_100), pitStop('mclaren', 5_200), pitStop('williams', 3_000)];

describe('build result', () => {
  const result = buildResult(race, qualify, pitStops, 'ham', mercedes);

  it('should have the first seven of the qualifying', () => {
    expect(result.qualify).toStrictEqual(['ver', 'had', 'nor', 'pia', 'lec', 'ham', 'ant']);
  });

  it('should have the first four of the race in the podium', () => {
    expect(result.podium).toStrictEqual(['had', 'ver', 'lec', 'nor']);
  });

  it('should have the two fastest laps', () => {
    expect(result.fastestDriver).toStrictEqual(['lec', 'had']);
  });

  it('should have the last three who did not finish as the first crashes, last first', () => {
    expect(result.firstCrash).toStrictEqual(['alo', 'str', 'ham']);
  });

  it('should have the teams of the two slowest pit stops, each team once', () => {
    expect(result.slowestPitStop).toStrictEqual(['mclaren', 'ferrari']);
  });

  it('should have the grid and finish of the selected driver', () => {
    expect(result.selectedDriver).toStrictEqual({ grid: 6, finish: 8 });
  });

  it('should let a selected driver who starts from the pit lane start last', () => {
    expect(buildResult(race, qualify, pitStops, 'rus', mercedes).selectedDriver).toStrictEqual({ grid: 10, finish: 7 });
  });

  it('should have the first driver of the selected team in the qualifying and the race', () => {
    expect(result.selectedTeam).toStrictEqual({ qualify: 'ant', result: 'ant' });
  });

  it('should have the time of the pole position', () => {
    expect(result.polePositionTime).toBe(79_000);
  });

  it('should leave out the race, when it has not been driven', () => {
    const qualifyOnly = buildResult(null, qualify, null, 'ham', mercedes);

    expect(qualifyOnly.qualify).toHaveLength(7);
    expect(qualifyOnly.podium).toStrictEqual([]);
    expect(qualifyOnly.selectedDriver).toBeNull();
    expect(qualifyOnly.selectedTeam).toStrictEqual({ qualify: 'ant', result: undefined });
    expect(qualifyOnly.slowestPitStop).toStrictEqual([]);
  });
});

describe('build interim result', () => {
  it('should have the qualifying, the grid of the selected driver and the first driver of the team', () => {
    expect(buildInterimResult(qualify, 'ham', mercedes)).toStrictEqual({
      qualify: ['ver', 'had', 'nor', 'pia', 'lec', 'ham', 'ant'],
      selectedDriver: { grid: 6 },
      selectedTeam: { qualify: 'ant' },
      polePositionTime: 79_000,
    });
  });

  it('should use the time of Q3 for the pole position, when the qualifying has it', () => {
    const live = { ...qualify, results: qualify.results.map((r, index) => (index === 0 ? { ...r, q3: 78_500 } : r)) };

    expect(buildInterimResult(live, 'ham', mercedes).polePositionTime).toBe(78_500);
  });

  it('should leave out the grid, when the selected driver has no time yet', () => {
    expect(buildInterimResult(qualify, 'bot', mercedes).selectedDriver).toStrictEqual({ grid: undefined });
  });
});
