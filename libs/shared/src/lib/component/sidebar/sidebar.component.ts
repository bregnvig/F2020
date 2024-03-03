import { ChangeDetectionStrategy, Component, computed, EventEmitter, OnInit, Output, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlayerStore, SeasonStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { icon } from '../../font-awesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDividerModule } from '@angular/material/divider';
import { SidenavButtonComponent } from './sidenav-button/sidenav-button.component';
import { HasRoleDirective } from '../has-role.directive';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'sha-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatListModule, HasRoleDirective, SidenavButtonComponent, RouterLink, MatDividerModule, FontAwesomeModule, AsyncPipe, NgOptimizedImage],
})
export class SidebarComponent implements OnInit {

  @Output() closing = new EventEmitter<void>();
  player: Signal<Player>;
  seasonId: Signal<string>;
  icon = icon;

  constructor(store: PlayerStore, private seasonStore: SeasonStore, private router: Router) {
    this.player = store.player;
    this.seasonId = computed(() => this.seasonStore.season()?.id);
  }

  ngOnInit(): void {
  }

  signIn() {
    this.router.navigate(['login']);
  }
}
