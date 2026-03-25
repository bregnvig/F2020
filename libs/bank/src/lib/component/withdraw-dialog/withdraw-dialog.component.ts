import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { AccountService } from '../../service';
import { Player } from '@f2020/data';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 mat-dialog-title>{{ data.player.displayName }}</h1>
    <div mat-dialog-content [formGroup]="fg">
      <p>Hvor mange penge skal der hæves?</p>
      <p>Dog maksimalt {{ data.player.balance | currency: 'DKK' }}</p>
      <mat-form-field>
        <mat-label>Beløb</mat-label>
        <input formControlName="amount" matInput type="number">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Besked</mat-label>
        <input formControlName="message" matInput placeholder="Udbetalt via MobilePay">
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button matDialogClose>Luk</button>
      <button mat-button (click)="withdraw()" [disabled]="fg.invalid">OK</button>
    </div>
  `,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    CurrencyPipe,
    MatFormField,
    MatInput,
    MatLabel,
    MatDialogActions,
    MatButton,
    MatDialogClose,
  ],
})
export class WithdrawDialogComponent {

  readonly #fb = inject(FormBuilder);
  readonly #dialogRef = inject(MatDialogRef<DepositDialogComponent>);
  readonly #service = inject(AccountService);

  data = inject<{ player: Player; }>(MAT_DIALOG_DATA);

  fg = this.#fb.group({
    amount: this.#fb.control(0, [Validators.required, Validators.min(0), Validators.max(Math.max(0, this.data.player.balance))]),
    message: this.#fb.control(''),
  });

  withdraw() {
    const { amount, message } = this.fg.value;
    this.#dialogRef.close(this.#service.withdraw(this.data.player.uid, amount, message || 'Udbetalt via MobilePay').then(() => amount));
  }

}
