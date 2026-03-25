import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    template: `
      <h3 mat-dialog-title>Er din konto er ved at løbe tør?</h3>
      <div mat-dialog-content>
        <p>Overfør penge via MobilePay til Flemming på <strong>28 71 22 34</strong></p>
      </div>
      <div mat-dialog-actions>
        <button mat-button mat-dialog-close>OK</button>
      </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatDialogModule, MatButtonModule]
})
export class DepositInfoDialogComponent {
}
