import { SeasonFacade } from './../../../season/+state/season.facade';
import { Component, OnInit } from '@angular/core';
import { RacesFacade } from '../../+state/races.facade';
import { RacesActions } from '../../+state/races.actions';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, map, pluck } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { IRace } from '@f2020/data';
import { Bid } from '../../model';

@UntilDestroy()
@Component({
  selector: 'f2020-race',
  styleUrls: ['./race.component.scss'],
  templateUrl: './race.component.html',
})
export class RaceComponent implements OnInit {

  center$: Observable<google.maps.LatLng>;
  race$: Observable<IRace>;
  bid$: Observable<Partial<Bid>>;
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

  constructor(private facade: RacesFacade, private seasonFacade: SeasonFacade, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadBid());
    this.facade.dispatch(RacesActions.loadBids());

    const raceId$ = this.route.params.pipe(
      pluck<Params, string>('country'),
      untilDestroyed(this),
    );

    raceId$.subscribe(id => this.facade.dispatch(RacesActions.selectRace({ country: id })));
    this.race$ = this.facade.selectedRace$.pipe(filter(race => !!race));
    this.bid$ = this.facade.bid$;
    this.bids$ = this.facade.bids$;
    this.center$ = this.race$.pipe(
      map(race => new google.maps.LatLng(race.location.lat, race.location.lng)),
    );
  }

}
