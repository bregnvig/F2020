import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-race-outlet',
  template: '<router-outlet/>',
  imports: [RouterOutlet],
})
export class RaceOutletComponent {

}

