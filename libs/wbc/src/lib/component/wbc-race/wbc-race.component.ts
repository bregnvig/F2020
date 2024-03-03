import { ChangeDetectionStrategy, Component, computed, Signal } from '@angular/core';
import { SeasonStore } from '@f2020/api';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { WBCResult } from '@f2020/data';
import { map } from 'rxjs/operators';
import { FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-wbc-race',
  templateUrl: './wbc-race.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatListModule, RouterLink, LoadingComponent, AsyncPipe, FlagURLPipe, NgOptimizedImage],
})
export class WbcRaceComponent {

  result: Signal<WBCResult>;

  constructor(store: SeasonStore, route: ActivatedRoute) {
    const round = toSignal(route.params.pipe(map<Params, string>(params => params.round)));
    this.result = computed(() => store.season().wbc?.results.find(result => result.round === parseInt(round(), 10)));
  }

}
