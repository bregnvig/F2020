import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PlayerApiModule } from '@f2020/api';
import { LoginComponent } from './component';
import { CardPageComponent } from './component/card-page/card-page.component';
import { HasRoleDirective } from './component/has-role.directive';
import { LoadingComponent } from './component/loading/loading.component';
import { PageComponent } from './component/page/page.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { SidenavButtonComponent } from './component/sidebar/sidenav-button/sidenav-button.component';
import { DateTimePipe } from './pipe/date-time.pipe';
import { FlagURLPipe } from './pipe/flag-url.pipe';
import { PolePositionTimePipe } from './pipe/pole-position-time.pipe';
import { RelativeToNowPipe } from './pipe/relative-to-now.pipe';

const materialModules = [
  MatListModule,
  MatIconModule,
  MatButtonModule,
  MatToolbarModule,
  MatSlideToggleModule
];

const exportComponents = [
  LoginComponent,
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
];

@NgModule({
  declarations: [
    exportComponents,
    pipes,
    SidenavButtonComponent,
    HasRoleDirective,
  ],
  exports: [
    exportComponents,
    pipes,
    HasRoleDirective,
  ],
  providers: [
    PolePositionTimePipe,
    DatePipe,
    DateTimePipe,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    RouterModule,
    PlayerApiModule,
    materialModules
  ],
})
export class SharedModule {
}

