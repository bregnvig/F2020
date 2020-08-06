import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RacesFacade } from '@f2020/api';
import { IRace } from '@f2020/data';
import { Observable } from 'rxjs';

@Component({
  selector: 'f2020-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayResultComponent implements OnInit {

  race$: Observable<IRace>;
  
  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.race$ = this.facade.selectedRace$;
  }

}
