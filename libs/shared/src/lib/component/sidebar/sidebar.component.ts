import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, OnInit, Output, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlayerStore, SeasonStore } from '@f2020/api';
import { icon } from '../../font-awesome';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatDividerModule } from '@angular/material/divider';
import { SidenavButtonComponent } from './sidenav-button/sidenav-button.component';
import { HasRoleDirective } from '../has-role.directive';
import { NgOptimizedImage } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'sha-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatListModule, HasRoleDirective, SidenavButtonComponent, RouterLink, MatDividerModule, FaIconComponent, NgOptimizedImage],
})
export class SidebarComponent implements OnInit {

  @Output() closing = new EventEmitter<void>();
  player = inject(PlayerStore).player;
  seasonId: Signal<string>;
  icon = icon;

  constructor(private router: Router) {
    const season = inject(SeasonStore).season;
    this.seasonId = computed(() => season()?.id);
  }

  ngOnInit(): void {
  }

  signIn() {
    this.router.navigate(['login']);
  }
}
