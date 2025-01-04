import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { IDriverQualifying } from '@f2020/data';
import { PolePositionTimePipe } from '@f2020/shared';

@Component({
  selector: 'f2020-qualifying-times',
  template: `
    <span>{{ qualifying() }}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [PolePositionTimePipe],
})
export class QualifyingTimesComponent {

  #polePosition = inject(PolePositionTimePipe);
  qualifying = input.required<string, IDriverQualifying>({
    transform: q => {
      return q.duration ? this.#polePosition.transform(q.duration) : 'Ingen tid';
    },
  });

}
