import { inject, InjectionToken, Provider } from '@angular/core';
import { DateTime } from 'luxon';
import { RaceStore } from '../+state';
import { LiveResultService } from './live-result.service';
import { RaceResultService } from './race-result.service';
import { ReplayResultService } from './replay-result.service';

export const RACE_RESULT_SERVICE = new InjectionToken<RaceResultService>('RaceResultService');

function raceResultServiceFactory(
  liveResultService: LiveResultService,
  replayResultService: ReplayResultService,
  raceStore: InstanceType<typeof RaceStore>,
): RaceResultService {
  const race = raceStore.race();

  if (!race) throw new Error('No race loaded in RaceStore');
  const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

  const isRaceOpen = latestEndTime > DateTime.now().toUTC();
  return isRaceOpen ? liveResultService : replayResultService;
}

export function provideRaceResultService(): Provider[] {
  return [
    LiveResultService,
    ReplayResultService,
    {
      provide: RACE_RESULT_SERVICE,
      useFactory: () => {
        const liveResultService = inject(LiveResultService);
        const replayResultService = inject(ReplayResultService);
        const raceStore = inject(RaceStore);
        return raceResultServiceFactory(liveResultService, replayResultService, raceStore);
      },
    },
  ];
}
