import { computed, inject } from '@angular/core';
import { RacesStore } from '@f2020/api';
import { SeasonLine } from './season-chart';

/**
 * Names races as the app does, so the graphs from OpenF1 data use the same names as the WBC graph. OpenF1 names them without the sponsor.
 * Call it in an injection context, and the returned function in a computed, so the names follow the races
 */
export const injectRaceNames = () => {
  const races = inject(RacesStore).races;
  const names = computed(() => new Map((races() ?? []).map(race => [race.round, race.name])));
  return (races: SeasonLine['races'] = []): SeasonLine['races'] => races.map(race => ({ ...race, name: names().get(race.round) ?? race.name }));
};
