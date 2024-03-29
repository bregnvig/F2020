import { Component } from '@angular/core';

@Component({
    selector: 'sha-card-page',
    template: `
    <div>
      <div class="p-3 grid gap-x-4 gap-y-4 grid-cols-1 max-w-3xl mx-auto">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    styleUrls: ['./card-page.component.scss'],
    standalone: true,
})
export class CardPageComponent {

}
