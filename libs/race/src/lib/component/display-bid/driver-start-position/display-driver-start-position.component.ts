import { Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';

export interface DriverStartPosition {
  grid: number;
  gridPoints?: number;
  compareGrid?: number;
  compareGridPoints?: number;
  finish: number;
  finishPoints?: number;
  compareFinish?: number;
  compareFinishPoints?: number;
}

@Component({
  selector: 'f2020-display-driver-start-position',
  template: `
    @let dsp = driverStartPosition();
    <mat-list-item>
      @if (dsp.compareGrid) {
        <span class="flex justify-between">
          <h4 matListItemTitle>Startede som nummer {{ dsp.grid }}</h4>
          <h4 matListItemTitle class="!text-gray-400">nummer {{ dsp.compareGrid }}</h4>
        </span>
      } @else {
        <h4 matListItemTitle>Startede som nummer {{ dsp.grid }}</h4>
      } 
      @if (dsp.gridPoints !== undefined) { 
        @if (dsp.compareGrid) {
          <span class="flex justify-between mt-1">
            <small class="text-sm">{{ dsp.gridPoints }} point</small>
            <small class="text-sm text-gray-500">{{ dsp.compareGridPoints }} point</small>
          </span>
        } @else {
          <small class="text-sm">{{ dsp.gridPoints }} point</small>
        } 
      }
    </mat-list-item>
    @if (dsp.finish) {
      <mat-list-item>
        @if (dsp.compareFinish) {
        <span class="flex justify-between">
          <h4 matListItemTitle>Sluttede som nummer {{ dsp.finish }}</h4>
          <h4 matListItemTitle class="!text-gray-400">nummer {{ dsp.compareFinish }}</h4>
        </span>
        } @else {
        <h4 matListItemTitle>Sluttede som nummer {{ dsp.finish }}</h4>
        } @if (dsp.finishPoints !== undefined) { @if (dsp.compareFinish) {
        <span class="flex justify-between mt-1">
          <small class="text-sm">{{ dsp.finishPoints }} point</small>
          <small class="text-sm text-gray-500">{{ dsp.compareFinishPoints }} point</small>
        </span>
        } @else {
        <small class="text-sm">{{ dsp.finishPoints }} point</small>
        } }
      </mat-list-item>
    }
  `,
  imports: [MatListModule],
})
export class DisplayDriverStartPositionComponent {
  driverStartPosition = input.required<DriverStartPosition>();
}
