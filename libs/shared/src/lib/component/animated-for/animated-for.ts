import { Directive, effect, EmbeddedViewRef, inject, input, TemplateRef, untracked, ViewContainerRef } from '@angular/core';

export interface AnimatedForContext<T> {
  $implicit: T;
  /** The place of the item in the list, which can differ from where its row is in the page */
  index: number;
}

/**
 * Like `@for`, but the rows slide to their new places when the order changes. The rows stay in the order they came in, and each is
 * moved to its place with a transform, so every row must have the same height, without margins. Rows that come later are added at
 * the end, and rows that are no longer there are removed.
 *
 * ```html
 * <mat-list-item *shaAnimatedFor="let lap of laps(); key: lapKey; let index = index">
 * ```
 */
@Directive({
  selector: '[shaAnimatedFor][shaAnimatedForOf]',
})
export class AnimatedForDirective<T> {
  shaAnimatedForOf = input.required<readonly T[]>();
  /** What tells the items apart, like the track of `@for` */
  shaAnimatedForKey = input.required<(item: T) => string>();

  #template = inject<TemplateRef<AnimatedForContext<T>>>(TemplateRef);
  #container = inject(ViewContainerRef);
  #views = new Map<string, EmbeddedViewRef<AnimatedForContext<T>>>();

  constructor() {
    effect(() => {
      const items = this.shaAnimatedForOf();
      const key = this.shaAnimatedForKey();
      untracked(() => this.#render(items, key));
    });
  }

  static ngTemplateContextGuard<T>(_directive: AnimatedForDirective<T>, context: unknown): context is AnimatedForContext<T> {
    return true;
  }

  #render(items: readonly T[], key: (item: T) => string) {
    const keys = new Set(items.map(key));
    this.#views.forEach((view, id) => {
      if (!keys.has(id)) {
        view.destroy();
        this.#views.delete(id);
      }
    });
    items.forEach((item, index) => {
      const view = this.#views.get(key(item));
      if (view) {
        view.context.$implicit = item;
        view.context.index = index;
        view.markForCheck();
      } else {
        this.#views.set(key(item), this.#container.createEmbeddedView(this.#template, { $implicit: item, index }));
      }
    });
    this.#views.forEach(view => {
      const row = view.rootNodes.find((node): node is HTMLElement => node instanceof HTMLElement);
      if (row) {
        row.style.transition = 'transform 1s';
        row.style.transform = `translateY(${(view.context.index - this.#container.indexOf(view)) * 100}%)`;
      }
    });
  }
}
