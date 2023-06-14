import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RacesFacade } from '@f2020/api';
import { IRace } from '@f2020/data';
import { icon } from '@f2020/shared';
import { Observable } from 'rxjs';
import { LoadingComponent } from '../../../../../../shared/src/lib/component/loading/loading.component';
import { DisplayBidComponent } from '../display-bid.component';
import { MatListModule } from '@angular/material/list';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'f2020-display-result',
    templateUrl: './display-result.component.html',
    styleUrls: ['./display-result.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, MatToolbarModule, FontAwesomeModule, MatListModule, DisplayBidComponent, LoadingComponent, AsyncPipe]
})
export class DisplayResultComponent implements OnInit {

  race$: Observable<IRace>;
  icon = icon.fasFlagCheckered;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.race$ = this.facade.selectedRace$;
  }

}
