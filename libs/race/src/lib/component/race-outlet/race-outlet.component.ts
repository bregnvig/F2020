import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RacesFacade, RacesActions } from '@f2020/api';
import { AbstractSuperComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-race-outlet',
  template: '<router-outlet></router-outlet>'
})
export class RaceOutletComponent extends AbstractSuperComponent implements OnInit {

  constructor(
    private facade: RacesFacade,
    private route: ActivatedRoute) {
    super();
  }

  ngOnInit(): void {
    this.route.params.pipe(
      this.takeUntilDestroyed(),
    ).subscribe(({ round }) => this.facade.dispatch(RacesActions.selectRace({ round })));
  }

}

