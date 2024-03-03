import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IDriverQualifying } from '@f2020/data';
import { PolePositionTimePipe } from '@f2020/shared';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'f2020-qualifying-times',
  template: `
    @for (time of times; track $index) {
      <span [class.me-4]="!$last" [innerHTML]="time"></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe],
  providers: [PolePositionTimePipe],
})
export class QualifyingTimesComponent {

  times: string[];

  constructor(private polePosition: PolePositionTimePipe) {
  }

  @Input()
  set qualifying(value: IDriverQualifying) {
    this.times = ['q1', 'q2', 'q3']
      .map(q => `<strong>${q.toUpperCase()}</strong>: ${value[q] ? this.polePosition.transform(value[q]) : 'Ingen tid'}`);
  }
}
