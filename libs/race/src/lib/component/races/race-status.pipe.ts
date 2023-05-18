import { Pipe, PipeTransform } from '@angular/core';
import { IRace } from '@f2020/data';
import { RelativeToNowPipe } from 'libs/shared/src/lib/pipe/relative-to-now.pipe';
import { DateTime } from 'luxon';

const now = DateTime.now();

@Pipe({
  name: 'raceStatus'
})
export class RaceStatusPipe implements PipeTransform {
  constructor(private relativeToNow: RelativeToNowPipe) { }

  transform(race: IRace, ...args: unknown[]): unknown {
    switch (race.state) {
      case 'completed': return 'Afgjort';
      case 'cancelled': return 'Aflyst';
      case 'closed': return 'Afventer resultat';
      case 'waiting': return `Åbner om ${this.relativeToNow.transform(race.open)}`;
      default: {
        if (race.state === 'open' && race.close < now) {
          return 'Afventer resultat';
        }
        return `Lukker om ${this.relativeToNow.transform(race.close)}`;
      }
    }
  }
}