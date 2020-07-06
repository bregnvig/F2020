import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RacesFacade, RacesActions } from '@f2020/api';

@UntilDestroy()
@Component({
  selector: 'f2020-race-outlet',
  template: '<router-outlet></router-outlet>'
})
export class RaceOutletComponent implements OnInit {

  constructor(
    private facade: RacesFacade, 
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.params.pipe(
      untilDestroyed(this),
    ).subscribe(({round}) => this.facade.dispatch(RacesActions.selectRace({ round })));
  }

}

