import { PlayerFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'f2020-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  player$: Observable<Player>;

  constructor(private facade: PlayerFacade) {
  }

  ngOnInit(): void {
    this.player$ = this.facade.player$;
  }

}
