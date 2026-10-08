import { inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SeasonStore, StandingService } from '@f2020/api';
import { IChampionshipPoints, positionChange } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { switchMap } from 'rxjs/operators';
import { ChampionshipEntry } from './championship-list.component';

type EntryInfo = Pick<ChampionshipEntry, 'id' | 'name' | 'image' | 'logo'>;

export const topEntries = <T extends IChampionshipPoints>(items: T[], info: (item: T) => EntryInfo, count = 5): ChampionshipEntry[] =>
  items
    .map(item => ({ item, info: info(item) }))
    .sort((a, b) => b.item.points - a.item.points || a.info.name.localeCompare(b.info.name))
    .slice(0, count)
    .map(({ item, info }) => ({
      ...info,
      points: item.points,
      gained: item.previousPoints === undefined ? 0 : item.points - item.previousPoints,
      change: positionChange(item),
    }));

/**
 * The driver standings of the current season. Must be called in an injection context.
 */
export const injectDriverStandings = () => {
  const service = inject(StandingService);
  return toSignal(toObservable(inject(SeasonStore).season).pipe(
    truthy(),
    switchMap(season => service.getStandings(season.id)),
  ), { initialValue: [] });
};
