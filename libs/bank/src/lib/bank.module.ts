import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from "@angular/router";
import { PlayersApiModule } from '@f2020/api';
import { SharedModule } from '@f2020/shared';
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
    FlexLayoutModule,
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
