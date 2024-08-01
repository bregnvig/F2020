import { Component, inject, input, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RaceStore } from '@f2020/api';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-race-outlet',
  template: '<router-outlet/>',
  standalone: true,
  imports: [RouterOutlet],
  providers: [RaceStore],
})
export class RaceOutletComponent implements OnInit {

  round = input.required<string>();
  private store = inject(RaceStore);


  ngOnInit(): void {
    this.store.loadRace(this.round());
  }

}

