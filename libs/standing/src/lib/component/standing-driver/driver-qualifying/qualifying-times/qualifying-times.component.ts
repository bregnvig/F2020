import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IDriverQualifying } from '@f2020/data';
import { interval, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PolePositionTimePipe } from '@f2020/shared';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'f2020-qualifying-times',
  template: '{{times$ | async}}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe],
  providers: [PolePositionTimePipe],
})
export class QualifyingTimesComponent {

  times$: Observable<string>;

  constructor(private polePosition: PolePositionTimePipe) {
  }

  @Input()
  set qualifying(value: IDriverQualifying) {
    const times = ['q1', 'q2', 'q3']
      .map(q => `${q.toUpperCase()}: ${value[q] ? this.polePosition.transform(value[q]) : 'Ingen tid'}`);
    this.times$ = interval(2000).pipe(
      map(count => count + 1),
      startWith(0),
      map(count => times[count % 3]),
    );
  }
}
