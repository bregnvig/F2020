import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, min, pattern, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IDriver } from '@f2020/data';
import { DriverHeadshotComponent } from '@f2020/shared';

/** The fields of a driver the form edits. Text fields are empty instead of missing, and the numbers are a comma separated list */
interface DriverForm {
  name: string;
  code: string;
  permanentNumbers: string;
  activeNumber: number | null;
  teamName: string;
  teamColor: string;
  headshotUrl: string;
}

const toForm = (driver: IDriver): DriverForm => ({
  name: driver.name,
  code: driver.code,
  permanentNumbers: driver.permanentNumbers.join(', '),
  activeNumber: driver.activeNumber ?? null,
  teamName: driver.teamName ?? '',
  teamColor: driver.teamColor ?? '',
  headshotUrl: driver.headshotUrl ?? '',
});

const optional = (value: string) => value.trim() || undefined;

/** The fields the form doesn't show are kept */
const toDriver = (driver: IDriver, value: DriverForm): IDriver => ({
  ...driver,
  name: value.name.trim(),
  code: value.code.trim(),
  permanentNumbers: [...new Set(value.permanentNumbers.split(',').map(n => parseInt(n, 10)))],
  activeNumber: value.activeNumber ?? undefined,
  teamName: optional(value.teamName),
  teamColor: optional(value.teamColor),
  headshotUrl: optional(value.headshotUrl),
});

/** Edits a driver, but not the id, which is the document id. Closes with the edited driver, or nothing when cancelled */
@Component({
  selector: 'drivers-edit-driver-dialog',
  template: `
    <h2 mat-dialog-title class="title">
      <sha-driver-headshot [driver]="preview()" [size]="56" [style.box-shadow]="ring()" />
      <span class="titles">
        <span class="name">{{ preview().name || driver.driverId }}</span>
        <span class="subtitle">{{ subtitle() }}</span>
      </span>
    </h2>
    <form (submit)="save($event)">
      <mat-dialog-content>
        <div class="fields">
          <mat-form-field class="wide" subscriptSizing="dynamic">
            <mat-label>Navn</mat-label>
            <input matInput [formField]="form.name" />
            <mat-error>Navnet mangler</mat-error>
          </mat-form-field>
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Forkortelse</mat-label>
            <input matInput [formField]="form.code" />
            <mat-error>Tre store bogstaver, fx NOR</mat-error>
          </mat-form-field>
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Aktivt nummer</mat-label>
            <input matInput type="number" [formField]="form.activeNumber" />
            <mat-error>Et nummer fra 1</mat-error>
          </mat-form-field>
          <mat-form-field class="wide" subscriptSizing="dynamic">
            <mat-label>Alle numre</mat-label>
            <input matInput [formField]="form.permanentNumbers" />
            <mat-hint>Adskilt med komma. Bruges til at finde køreren i tidligere sessioner</mat-hint>
            <mat-error>Tal adskilt med komma, fx 28, 50</mat-error>
          </mat-form-field>
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Hold</mat-label>
            <input matInput [formField]="form.teamName" />
          </mat-form-field>
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Holdfarve</mat-label>
            <input matInput [formField]="form.teamColor" />
            <input
              matIconSuffix
              type="color"
              class="swatch"
              aria-label="Vælg holdfarve"
              [value]="form.teamColor().valid() && model().teamColor ? '#' + model().teamColor : '#000000'"
              (input)="pickColor($event)" />
            <mat-error>Seks hex cifre, fx 9C9FA2</mat-error>
          </mat-form-field>
          <mat-form-field class="wide" subscriptSizing="dynamic">
            <mat-label>Billede</mat-label>
            <input matInput type="url" [formField]="form.headshotUrl" />
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuller</button>
        <button mat-flat-button type="submit" [disabled]="form().invalid()">Gem</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    /* Material puts a spacer before the text of a title, which would be a flex item */
    .title::before {
      display: none;
    }
    .title {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-top: 1.5rem;
    }
    .titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .subtitle {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: var(--mat-sys-on-surface-variant);
    }
    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      /* Room for the label of the first field, which the dialog content would cut */
      padding-top: 0.5rem;
    }
    .wide {
      grid-column: 1 / -1;
    }
    @media (max-width: 480px) {
      .fields {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .swatch {
      width: 1.75rem;
      height: 1.75rem;
      margin-right: 0.75rem;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
    }
    .swatch::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    .swatch::-webkit-color-swatch {
      border: 1px solid var(--mat-sys-outline);
      border-radius: 50%;
    }
    .swatch::-moz-color-swatch {
      border: 1px solid var(--mat-sys-outline);
      border-radius: 50%;
    }
  `,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormField, DriverHeadshotComponent],
})
export class EditDriverDialog {
  readonly #dialogRef = inject<MatDialogRef<EditDriverDialog, IDriver>>(MatDialogRef);
  protected readonly driver = inject<IDriver>(MAT_DIALOG_DATA);
  protected readonly model = signal(toForm(this.driver));
  protected readonly form = form(this.model, path => {
    required(path.name);
    required(path.code);
    pattern(path.code, /^[A-Z]{3}$/);
    required(path.permanentNumbers);
    pattern(path.permanentNumbers, /^\s*\d+(\s*,\s*\d+)*\s*$/);
    min(path.activeNumber, 1);
    pattern(path.teamColor, /^[0-9A-Fa-f]{6}$/);
  });
  /** The headshot follows the image and team as they are edited */
  protected readonly preview = computed(() => ({ ...this.driver, name: this.model().name, teamName: this.model().teamName, headshotUrl: this.model().headshotUrl }));
  /** A ring in the colour of the team around the headshot */
  protected readonly ring = computed(
    () => `0 0 0 3px ${this.form.teamColor().valid() && this.model().teamColor ? `#${this.model().teamColor}` : 'var(--mat-sys-outline-variant)'}`,
  );
  protected readonly subtitle = computed(() => {
    const { code, activeNumber, teamName } = this.model();
    return [code, activeNumber ? `#${activeNumber}` : '', teamName].filter(part => !!part).join(' · ');
  });

  protected pickColor(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    this.form.teamColor().value.set(color.slice(1).toUpperCase());
  }

  protected save(event: Event) {
    event.preventDefault();
    submit(this.form, async () => {
      this.#dialogRef.close(toDriver(this.driver, this.model()));
      return undefined;
    });
  }
}
