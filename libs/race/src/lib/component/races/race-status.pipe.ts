import { Pipe, PipeTransform } from '@angular/core';
import { IRace } from '@f2020/data';
import { DateTime } from 'luxon';

const now = DateTime.now();

@Pipe({
  name: 'raceStatus',
  standalone: true,
})
export class RaceStatusPipe implements PipeTransform {
  transform(race: IRace, ...args: unknown[]): unknown {
    switch (race.state) {
      case 'completed':
        return 'Afgjort';
      case 'cancelled':
        return 'Aflyst';
      case 'closed':
        return 'Afventer resultat';
      case 'waiting':
        return `Åbner om ${race.open.toRelative({ locale: 'da' })}`;
      default: {
        if (race.state === 'open' && race.close < now) {
          return 'Afventer resultat';
        }
        return `Lukker om ${race.close.toRelative({ locale: 'da' })}`;
      }
    }
  }
}
