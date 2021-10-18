import { CommonModule } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from "@angular/router";
import { SharedModule } from '@f2020/shared';
import { AboutComponent } from './component/about/about.component';
import { MissingRoleComponent } from './component/missing-role/missing-role.component';
import { PrivacyPolicyComponent } from './component/privacy-policy/privacy-policy.component';
import { RulesComponent } from './component/rules/rules.component';
import { GithubService } from './service/github.service';

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: 'rules',
        component: RulesComponent,
      },
      {
        path: 'about',
        component: AboutComponent
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent,
      },
      {
        path: 'roles',
        component: MissingRoleComponent
      }
      /* {path: '', pathMatch: 'full', component: InsertYourComponentHere} */
    ])
  ],
  declarations: [
    RulesComponent,
    AboutComponent,
    MissingRoleComponent, PrivacyPolicyComponent
  ],
  providers: [
    GithubService
  ]
})
export class InfoModule { }
