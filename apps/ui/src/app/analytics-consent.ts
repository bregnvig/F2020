import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { AnalyticsService } from '@f2020/api';

@Component({
  template: `
    <div class="flex items-start gap-4 pt-2">
      <img class="shrink-0 rounded-full bg-white p-2" width="48" height="48" src="assets/google-analytics.svg" alt="Google Analytics" />
      <div>
        <h3 class="!m-0 text-lg font-medium">Må vi følge med?</h3>
        <p class="mt-1 mb-0 opacity-80">
          Vi vil gerne bruge Google Analytics til at se, hvordan appen bliver brugt. Det sætter cookies fra Google. Du kan altid ændre dit valg under Profil.
        </p>
      </div>
    </div>
    <div class="flex justify-end gap-2 py-2">
      <button mat-button (click)="answer(false)">Afvis</button>
      <button mat-flat-button color="primary" (click)="answer(true)">Accepter</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
})
export class AnalyticsConsent {
  #analytics = inject(AnalyticsService);
  #sheet = inject(MatBottomSheetRef);

  protected answer(granted: boolean) {
    this.#analytics.setConsent(granted);
    this.#sheet.dismiss();
  }
}
