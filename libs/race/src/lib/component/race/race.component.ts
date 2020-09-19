import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'f2020-race',
  styleUrls: ['./race.component.scss'],
  templateUrl: './race.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RaceComponent implements OnInit {

  center$: Observable<google.maps.LatLng>;
  race$: Observable<IRace>;
  play$: Observable<boolean>;
  bids$: Observable<Bid[]>;

  options: google.maps.MapOptions = {
    draggable: true,
    zoomControl: false,
    scrollwheel: false,
    fullscreenControl: false,
    streetViewControl: true,
    mapTypeControl: false,
    zoom: 15,
    mapTypeId: 'roadmap',
  };

  constructor(private facade: RacesFacade) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadBids());

    this.race$ = this.facade.selectedRace$.pipe(filter(race => !!race));
    this.bids$ = this.facade.bids$;
    this.play$ = combineLatest([
      this.race$,
      this.bids$
    ]).pipe(
      debounceTime(100),
      map(([race, bids]) => race.state === 'open' && !(bids || []).length)
    );
    this.center$ = this.race$.pipe(
      map(race => new google.maps.LatLng(race.location.lat, race.location.lng)),
    );
  }

  flagURL(race: IRace) {
    return `https://www.countryflags.io/${race.countryCode.toLocaleLowerCase()}/flat/64.png`;
  }
}
