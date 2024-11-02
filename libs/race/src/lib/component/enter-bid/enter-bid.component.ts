import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { PlayerStore, RacesService, RaceStore, TeamService } from '@f2020/api';
import { BidComponent } from '@f2020/control';
import { Bid, IRace, ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filterEquals, isNullish, truthy } from '@f2020/tools';
import { firstValueFrom } from 'rxjs';


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
  styleUrls: ['./enter-bid.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterLink, FontAwesomeModule, BidComponent, ReactiveFormsModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe],
})
export class EnterBidComponent {

  bidControl: FormControl = new FormControl<Bid>(null, noNullsInArray);
  isOpen: Signal<boolean>;
  race: Signal<IRace>;
  teams: Signal<ITeam[]>;
  editIcon = icon.farPen;
  sendIcon = icon.fasPaperPlane;
  private store = inject(RaceStore);

  constructor(
    private teamsService: TeamService,
    racesService: RacesService,
    private router: Router) {
    const playerId = inject(PlayerStore).player().uid;
    this.race = this.store.race;
    this.teams = toSignal(this.teamsService.teams$);
    this.isOpen = computed(() => this.store.race()?.close >= DateTime.local());
    firstValueFrom(toObservable(this.race).pipe(
      truthy(),
      switchMap(race => racesService.getBid(race.season, race.round, playerId)),
      map(bid => bid || {}),
    )).then(yourBid => this.bidControl.patchValue(yourBid, { emitEvent: false }));
    effect(() => this.store.bid()?.submitted && this.bidControl.disable({ emitEvent: false }));
    effect(() => this.store.error() && this.bidControl.enable({ emitEvent: false }));
    const updatedBid = toSignal(this.bidControl.valueChanges.pipe(
      debounceTime(3000),
      filter(bid => !bid?.submitted),
      filterEquals(),
    ));
    effect(() => this.store.updateBid(updatedBid()));
  }

  submitBid() {
    this.store.submitBid(this.bidControl.value)
      .then(() => this.router.navigate([this.race().season, 'race', this.race().round]))
      .catch(error => {
        this.bidControl.enable({ emitEvent: false });
        console.info(this.bidControl.value);
        console.error(error);
      });
    this.bidControl.disable({ emitEvent: false });
  }

}
