import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AccountsListComponent } from './component/accounts-list/accounts-list.component';
import { AccountsComponent } from './component/accounts/accounts.component';
import { MyTransactionsComponent } from './component/my-transactions/my-transactions.component';
import { PlayerTransactionsComponent } from './component/player-transactions/player-transactions.component';
import { AccountService } from './service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'me',
        component: MyTransactionsComponent
      },
      {
        path: '',
        component: AccountsComponent,
        children: [
          {
            path: '',
            component: AccountsListComponent
          },
          {
            path: ':uid',
            component: PlayerTransactionsComponent
          }
        ]
      }
    ]),

  ],
  providers: [
    AccountService
  ]
})
export class BankModule { }
