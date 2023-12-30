import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlayerStore, SeasonFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { icon } from '../../font-awesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDividerModule } from '@angular/material/divider';
import { SidenavButtonComponent } from './sidenav-button/sidenav-button.component';
import { HasRoleDirective } from '../has-role.directive';
import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'sha-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatListModule, NgIf, HasRoleDirective, SidenavButtonComponent, RouterLink, MatDividerModule, FontAwesomeModule, AsyncPipe, NgOptimizedImage],
})
export class SidebarComponent implements OnInit {

  @Output() closing = new EventEmitter<void>();
  player: Signal<Player>;
  seasonId$: Observable<string>;
  icon = icon;

  constructor(private store: PlayerStore, private seasonFacade: SeasonFacade, private router: Router) {
    this.player = store.player;
  }

  ngOnInit(): void {
    this.seasonId$ = this.seasonFacade.season$.pipe(map(season => season.id));
  }

  signIn() {
    this.router.navigate(['login']);
  }
}
