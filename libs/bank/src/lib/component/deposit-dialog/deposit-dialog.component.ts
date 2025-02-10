import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Player } from '@f2020/data';
import { AccountService } from '../../service';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';

@Component({
  template: `
    <h1 mat-dialog-title>{{ data.player.displayName }}</h1>
    <div mat-dialog-content [formGroup]="fg">
      <p>Hvor mange penge skal der indsættes?</p>
      <mat-form-field>
        <mat-label>Beløb</mat-label>
        <input formControlName="amount" matInput type="number">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Besked</mat-label>
        <input formControlName="message" matInput placeholder="Via MobilePay">
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="close()">Luk</button>
      <button mat-button (click)="deposit()" [disabled]="fg.invalid">OK</button>
    </div>
  `,
  imports: [MatDialogTitle, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatButton, MatDialogActions, MatDialogContent],
})
export class DepositDialogComponent {

  #fb = inject(FormBuilder);
  #dialogRef = inject(MatDialogRef<DepositDialogComponent>);
  #service = inject(AccountService);

  fg = this.#fb.group({
    amount: this.#fb.control(0, [Validators.required, Validators.min(0)]),
    message: this.#fb.control(''),
  });

  data = inject<{ player: Player; }>(MAT_DIALOG_DATA);

  deposit() {
    const { amount, message } = this.fg.value;
    this.#dialogRef.close(this.#service.deposit(this.data.player.uid, amount, message || 'Via MobilePay').then(() => amount));
  }

  close(): void {
    this.#dialogRef.close();
  }
}
