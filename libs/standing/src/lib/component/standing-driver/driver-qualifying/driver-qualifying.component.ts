import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IQualifyResult } from '@f2020/data';
import { QualifyingTimesComponent } from './qualifying-times/qualifying-times.component';
import { NgFor } from '@angular/common';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-driver-qualifying',
    templateUrl: './driver-qualifying.component.html',
    styleUrls: ['./driver-qualifying.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule, NgFor, QualifyingTimesComponent]
})
export class DriverQualifyingComponent {
  @Input() qualifyResults: IQualifyResult[];
}
