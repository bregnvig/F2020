import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'sha-page',
    template: `<div></div>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class PageComponent {
}
