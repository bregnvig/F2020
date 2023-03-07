import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from "@angular/router";
import { PlayersApiModule } from '@f2020/api';
import { SharedModule } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AccountsListComponent } from './component/accounts-list/accounts-list.component';
import { AccountsComponent } from './component/accounts/accounts.component';
import { DepositDialogComponent } from './component/deposit-dialog/deposit-dialog.component';
import { DepositInfoDialogComponent } from './component/my-transactions/deposit-info-dialog/deposit-info-dialog.component';
import { MyTransactionsComponent } from './component/my-transactions/my-transactions.component';
import { PlayerTransactionsComponent } from './component/player-transactions/player-transactions.component';
import { TransactionsComponent } from './component/transactions/transactions.component';
import { TransferDialogComponent } from './component/transfer-dialog/transfer-dialog.component';
import { WithdrawDialogComponent } from './component/withdraw-dialog/withdraw-dialog.component';
import { AccountService } from './service';

@NgModule({
  declarations: [
    TransactionsComponent,
    AccountsComponent,
    MyTransactionsComponent,
    PlayerTransactionsComponent,
    AccountsListComponent,
    WithdrawDialogComponent,
    DepositDialogComponent,
    TransferDialogComponent,
    DepositInfoDialogComponent
  ],
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
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FontAwesomeModule,
    ScrollingModule,
    SharedModule,
    PlayersApiModule,
    ReactiveFormsModule,
  ],
  providers: [
    AccountService
  ]
})
export class BankModule { }
