import { Component, computed, inject, Signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { DateTimePipe } from '@f2020/shared';
import { LiveStatus } from '@f2020/api';

@Component({
  selector: 'live-status',
  template: `
    <div class="block max-h-[80vh] overflow-auto p-4">
      <h2 class="text-lg font-semibold mb-4">Live Status Monitor</h2>
      <div class="text-sm text-gray-500 mb-2">{{ data()?.length || 0 }} services monitored</div>
      <table mat-table [dataSource]="sortedData()" class="w-full">

        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef class="font-semibold">Service</th>
          <td mat-cell *matCellDef="let element" class="p-3">
            {{ formatName(element.name) }}
          </td>
        </ng-container>

        <!-- Latest Update Column -->
        <ng-container matColumnDef="latestUpdate">
          <th mat-header-cell *matHeaderCellDef class="font-semibold">Sidst opdateret</th>
          <td mat-cell *matCellDef="let element" class="p-3">
            @if (element.latestUpdate) {
              {{ element.latestUpdate | dateTime: 'HH:mm:ss' }}
            } @else {
              <span class="text-gray-400">-</span>
            }
          </td>
        </ng-container>

        <!-- Info Column -->
        <ng-container matColumnDef="info">
          <th mat-header-cell *matHeaderCellDef class="font-semibold">Info</th>
          <td mat-cell *matCellDef="let element" class="p-3">
            @if (element.info) {
              {{ element.info }}
            } @else {
              <span class="text-gray-400">-</span>
            }
          </td>
        </ng-container>

        <!-- Error Column -->
        <ng-container matColumnDef="error">
          <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
          <td mat-cell *matCellDef="let element" class="p-3">
            @if (element.error) {
              <span class="text-red-500">{{ element.error?.statusText || 'Error' }}</span>
            } @else {
              <span class="text-green-500">OK</span>
            }
          </td>
        </ng-container>

        <!-- Header and Row Definitions -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let _row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  imports: [
    MatTableModule,
    DateTimePipe,
  ],
})

export class LiveStatusComponent {
  data: Signal<(LiveStatus & { name: string })[]> = inject(MAT_BOTTOM_SHEET_DATA);

  displayedColumns: string[] = ['name', 'latestUpdate', 'info', 'error'];

  sortedData = computed(() => {
    const rawData = this.data();
    if (!rawData) return [];
    return rawData.toSorted((a, b) => a.name.localeCompare(b.name));
  });

  formatName(name: string): string {
    // Convert camelCase to readable format and capitalize first letter
    const formatted = name
      .replace(/Status$/i, '')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
