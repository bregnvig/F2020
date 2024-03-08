import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { RacesStore, RaceStore, TeamService } from '@f2020/api';
import { BidComponent } from '@f2020/control';
import { Bid, IRace, ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { debounceTime, filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { filterEquals } from '@f2020/tools';

@Component({
  selector: 'f2020-enter-bid',
  templateUrl: './enter-bid.component.html',
  styleUrls: ['./enter-bid.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterLink, FontAwesomeModule, BidComponent, ReactiveFormsModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe],
})
export class EnterBidComponent {

  bidControl: FormControl = new FormControl<Bid>(null);
  isOpen: Signal<boolean>;
  race: Signal<IRace>;
  teams: Signal<ITeam[]>;
  editIcon = icon.farPen;
  sendIcon = icon.fasPaperPlane;

  constructor(
    private store: RaceStore,
    { yourBid }: RacesStore,
    private teamsService: TeamService,
    private router: Router) {
    this.race = this.store.race;
    this.teams = toSignal(this.teamsService.teams$);
    this.isOpen = computed(() => store.race()?.close >= DateTime.local());
    effect(() => {
      this.bidControl.patchValue(yourBid() ?? {}, { emitEvent: false });
      store.bid()?.submitted && this.bidControl.disable({ emitEvent: false });
    });
    effect(() => store.error() && this.bidControl.enable({ emitEvent: false }));
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
