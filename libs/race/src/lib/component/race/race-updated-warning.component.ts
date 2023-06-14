import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IRace } from '@f2020/data';
import { icon } from '@f2020/shared';
import { DriverNamePipe } from '../../../../../driver/src/lib/pipe/driver-name.pipe';
import { DateTimePipe } from '../../../../../shared/src/lib/pipe/date-time.pipe';
import { NgFor, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'f2020-race-updated-warning',
    template: `
      <mat-card>
        <mat-card-header class="text-yellow-500" >
          <fa-icon mat-card-avatar [icon]="infoIcon" size="2x"></fa-icon>
          <mat-card-title>Løbet er blevet opdateret</mat-card-title>
        </mat-card-header>
        <mat-card-content>
        <p *ngFor="let updatedBy of race.updatedBy" class="flex flex-row items-center">
          <img [src]="updatedBy.player.photoURL" class="avatar" [alt]="updatedBy.player.displayName">
          <span class="ml-2 flex flex-col">
            <span>
              {{updatedBy.player.displayName}} har ændret 
              <span *ngIf="updatedBy.close">&nbsp;lukke tidspunktet til {{updatedBy.close | dateTime: 'shortTime'}}</span>
              <span *ngIf="updatedBy.close && updatedBy.selectedDriver">&nbsp;og</span>
              <span *ngIf="updatedBy.selectedDriver">&nbsp;udvalgte kører til {{updatedBy.selectedDriver | driverName}}</span>
            </span>
            <small class="text-slate-400">{{updatedBy.updatedAt | dateTime: 'short'}}</small>
          </span>
        </p>
        </mat-card-content>
      </mat-card>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatCardModule, FontAwesomeModule, NgFor, NgIf, DateTimePipe, DriverNamePipe]
})
export class RaceUpdatedWarningComponent {

  infoIcon = icon.farInfo;
  @Input() race: IRace;

}
