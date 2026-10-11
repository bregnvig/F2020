import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { IDriver, IRace } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LiveTrackDriversComponent } from './live-track-drivers';

export interface LiveTrackDriversData {
  race: IRace;
  drivers: IDriver[];
}

/** The cars on the track in fullscreen */
@Component({
  selector: 'f2020-live-track-drivers-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-full p-4 text-white" style="font-family: Roboto, sans-serif">
      <f2020-live-track-drivers class="block w-full h-full" [race]="data.race" [drivers]="data.drivers" />
    </div>
    <!-- Last, so it is drawn on top of the track -->
    <button mat-icon-button mat-dialog-close class="!fixed top-2 right-2 z-10 !text-white" aria-label="Luk">
      <fa-icon [icon]="icons.farXmark" />
    </button>
  `,
  imports: [LiveTrackDriversComponent, MatIconButton, MatDialogClose, FaIconComponent],
  host: { '(document:keydown.escape)': 'close()' },
})
export class LiveTrackDriversDialogComponent {
  protected readonly icons = icon;
  #dialogRef = inject(MatDialogRef);
  protected readonly data = inject<LiveTrackDriversData>(MAT_DIALOG_DATA);

  /** Esc closes it wherever the focus is */
  protected close() {
    this.#dialogRef.close();
  }
}
