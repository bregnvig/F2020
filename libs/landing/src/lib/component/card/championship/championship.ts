import { IChampionshipPoints, positionChange } from '@f2020/data';
import { ChampionshipEntry } from './championship-list';

type EntryInfo = Pick<ChampionshipEntry, 'id' | 'name' | 'driver' | 'image' | 'logo'>;

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

