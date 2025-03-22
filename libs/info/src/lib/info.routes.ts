import { Routes } from '@angular/router';
import { RulesComponent } from './component/rules/rules.component';
import { AboutComponent } from './component/about/about.component';
import { PrivacyPolicyComponent } from './component/privacy-policy/privacy-policy.component';
import { MissingRoleComponent } from './component/missing-role/missing-role.component';

export const InfoRoutes: Routes = [
  {
    path: 'rules',
    component: RulesComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
  },
  {
    path: 'roles',
    component: MissingRoleComponent,
  },
];
