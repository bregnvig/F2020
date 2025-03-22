import { Routes } from '@angular/router';
import { AccountsListComponent } from './component/accounts-list/accounts-list.component';
import { AccountsComponent } from './component/accounts/accounts.component';
import { MyTransactionsComponent } from './component/my-transactions/my-transactions.component';
import { PlayerTransactionsComponent } from './component/player-transactions/player-transactions.component';


export const BankRoutes: Routes = [
  {
    path: 'me',
    component: MyTransactionsComponent,
  },
  {
    path: '',
    component: AccountsComponent,
    children: [
      {
        path: '',
        component: AccountsListComponent,
      },
      {
        path: ':uid',
        component: PlayerTransactionsComponent,
      },
    ],
  },
];
