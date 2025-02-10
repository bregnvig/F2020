import { NgIfContext } from '@angular/common';
import { Directive, effect, EmbeddedViewRef, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PlayerStore } from '@f2020/api';
import { ensureArray } from '@f2020/tools';

@Directive({
  selector: '[shaHasRole]',
  standalone: true,
})
export class HasRoleDirective {

  #thenViewRef: EmbeddedViewRef<NgIfContext> | null = null;
  #elseViewRef: EmbeddedViewRef<NgIfContext> | null = null;
  #condition = false;

  roles = input.required<string[], string[] | string>({
    alias: 'shaHasRole',
    transform: value => ensureArray(value),
  });
  elseTemplateRef = input<TemplateRef<NgIfContext> | null>(null, {
    alias: 'shaHasRoleElse',
  });


  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef) {
    const { player } = inject(PlayerStore);
    effect(() => {
      this.#condition = (player()?.roles || []).some(r => this.roles().some(role => role === r));
      this.#updateView();
    });
    effect(() => {
      this.elseTemplateRef();
      this.#elseViewRef = null;  // clear previous view if any.
      this.#updateView();
    });
  }

  #updateView() {
    if (this.#condition) {
      if (!this.#thenViewRef) {
        this.viewContainer.clear();
        this.#elseViewRef = null;
        this.#thenViewRef = this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      if (!this.#elseViewRef) {
        this.viewContainer.clear();
        this.#thenViewRef = null;
        if (this.elseTemplateRef()) {
          this.#elseViewRef = this.viewContainer.createEmbeddedView(this.elseTemplateRef());
        }
      }
    }
  }
}
