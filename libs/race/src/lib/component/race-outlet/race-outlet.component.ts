import { Component, Input, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RaceStore } from '@f2020/api';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-race-outlet',
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [RouterOutlet],
  providers: [RaceStore],
})
export class RaceOutletComponent implements OnInit {

  @Input() round: string;

  constructor(private store: RaceStore) {
  }

  ngOnInit(): void {
    this.store.loadRace(parseInt(this.round));
  }

}

