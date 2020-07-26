import { Observable } from 'rxjs';
import { RacesFacade, RacesActions } from '@f2020/api';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IRace } from '@f2020/data';
import { filter, debounce } from 'rxjs/operators';

@Component({
  selector: 'f2020-remember-to-play',
  templateUrl: './remember-to-play.component.html',
  styleUrls: ['./remember-to-play.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RememberToPlayComponent implements OnInit {

  race$: Observable<IRace>;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadYourBid());
    this.race$ = this.facade.currentRace$.pipe(
      filter(race => race?.state === 'open'),
      debounce(() => this.facade.yourBid$.pipe(filter(bid => !(bid?.submitted))))
    );
  }

}
