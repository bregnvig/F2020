import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoginComponent, LogoutComponent } from './component';
import { CardPageComponent } from './component/card-page/card-page.component';
import { HasRoleDirective } from './component/has-role.directive';
import { LoadingComponent } from './component/loading/loading.component';
import { PageComponent } from './component/page/page.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { SidenavButtonComponent } from './component/sidebar/sidenav-button/sidenav-button.component';
import { TeamNamePipe } from './pipe';
import { DateTimePipe } from './pipe/date-time.pipe';
import { FlagURLPipe } from './pipe/flag-url.pipe';
import { PolePositionTimePipe } from './pipe/pole-position-time.pipe';
import { RelativeToNowPipe } from './pipe/relative-to-now.pipe';

const materialModules = [
  MatListModule,
  MatIconModule,
  MatButtonModule,
  MatToolbarModule,
  MatSlideToggleModule,
];

const exportComponents = [
  LoginComponent,
  LogoutComponent,
  LoadingComponent,
  PageComponent,
  CardPageComponent,
  SidebarComponent,
];

const pipes = [
  RelativeToNowPipe,
  FlagURLPipe,
  PolePositionTimePipe,
  DateTimePipe,
  TeamNamePipe,
];

@NgModule({
  exports: [
    exportComponents,
    pipes,
    HasRoleDirective,
  ],
  providers: [
    PolePositionTimePipe,
    DatePipe,
    DateTimePipe,
    RelativeToNowPipe,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    materialModules,
    exportComponents,
    pipes,
    SidenavButtonComponent,
    HasRoleDirective,
  ],
})
export class SharedModule {
}

