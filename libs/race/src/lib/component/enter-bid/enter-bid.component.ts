import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFabButton, MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { PlayerStore, RacesService, RaceStore, TeamService } from '@f2020/api';
import { BidComponent } from '@f2020/control';
import { Bid, IRace, ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { filterEquals, isNullish, truthy } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';


const noNullsInArray = (control: FormControl<Bid>) => {

  return Object.values(control.value ?? {})
    .filter(value => Array.isArray(value))
    .flat()
    .some(value => isNullish(value))
    ? { noNullsInArray: true }
    : null;

};


@Component({
  selector: 'f2020-enter-bid',
  templateUrl: './enter-bid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FaIconComponent, BidComponent, ReactiveFormsModule, LoadingComponent, MatToolbar, MatIconButton, MatFabButton],
})
export class EnterBidComponent {

  bidControl: FormControl = new FormControl<Bid>(null, noNullsInArray);
  isOpen: Signal<boolean>;
  race: Signal<IRace>;
  teams: Signal<ITeam[]>;
  editIcon = icon.farPen;
  sendIcon = icon.fasPaperPlane;

  #store = inject(RaceStore);
  #router = inject(Router);

  constructor(teamsService: TeamService, racesService: RacesService) {

    const playerId = inject(PlayerStore).player().uid;
    this.race = this.#store.race;
    this.teams = toSignal(teamsService.teams$);
    this.isOpen = computed(() => this.#store.race()?.close >= DateTime.local());

    firstValueFrom(toObservable(this.race).pipe(
      truthy(),
      switchMap(race => racesService.getBid(race.season, race.round, playerId)),
      map(bid => bid || {}),
    )).then(yourBid => this.bidControl.reset(yourBid, { emitEvent: false }));

    effect(() => this.#store.bid()?.submitted && this.bidControl.disable({ emitEvent: false }));
    effect(() => this.#store.error() && this.bidControl.enable({ emitEvent: false }));

    const updatedBid = toSignal(this.bidControl.valueChanges.pipe(
      debounceTime(3000),
      filter(bid => !bid?.submitted),
      filterEquals(),
    ));

    effect(() => this.#store.updateBid(updatedBid()));
  }

  submitBid() {
    this.#store.submitBid(this.bidControl.value)
      .then(() => this.#router.navigate([this.race().season, 'race', this.race().round]))
      .catch(error => {
        this.bidControl.enable({ emitEvent: false });
        console.info(this.bidControl.value);
        console.error(error);
      });
    this.bidControl.disable({ emitEvent: false });
  }

}
