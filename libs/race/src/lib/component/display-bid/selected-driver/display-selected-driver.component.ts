import { Component, computed, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';
import { icon } from '@f2020/shared';
import { NgClass } from '@angular/common';

export interface SelectedDriver {
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
  selector: 'f2020-display-selected-driver',
  template: `
    @let dsp = driverStartPosition();
    @let comparison = dsp.compareGrid && pointComparison();
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
            <small class="text-sm" [ngClass]="comparison.grid[1]">
              @if (comparison.grid[0]; as compIcon) {
                <fa-icon [icon]="compIcon" />
              }
              {{ dsp.compareGridPoints }} point
            </small>
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
          <small class="text-sm" [ngClass]="comparison.finish[1]">
              @if (comparison.finish[0]; as compIcon) {
                <fa-icon [icon]="compIcon" />
              }
            {{ dsp.compareFinishPoints }} point
            </small>
        </span>
        } @else {
        <small class="text-sm">{{ dsp.finishPoints }} point</small>
        } }
      </mat-list-item>
    }
  `,
  imports: [MatListModule, NgClass, FaIconComponent],
})
export class DisplaySelectedDriverComponent {
  driverStartPosition = input.required<SelectedDriver>();
  readonly pointComparison = computed(() => {
    const { gridPoints, compareGridPoints, finishPoints, compareFinishPoints } = this.driverStartPosition();

    const compare = (a: number, b: number): [[IconPrefix, IconName] | undefined, string] => {
      if (a < b) return [icon.fasAngleUp, 'text-green-500'];
      if (a > b) return [icon.fasAngleDown, 'text-red-500'];
      return [undefined, 'text-gray-500'];
    };

    return {
      grid: compare(gridPoints, compareGridPoints),
      finish: compare(finishPoints, compareFinishPoints),
    };
  });
}
