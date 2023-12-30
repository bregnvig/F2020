import { NgIfContext } from '@angular/common';
import { Directive, effect, EmbeddedViewRef, Input, signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { PlayerStore } from '@f2020/api';

@Directive({
  selector: '[shaHasRole]',
  standalone: true,
})
export class HasRoleDirective {

  private elseTemplateRef: TemplateRef<NgIfContext> | null = null;
  private thenViewRef: EmbeddedViewRef<NgIfContext> | null = null;
  private elseViewRef: EmbeddedViewRef<NgIfContext> | null = null;
  private condition = false;
  private roles = signal<string[]>([]);

  constructor(
    { player }: PlayerStore,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef) {
    effect(() => {
      this.condition = (player()?.roles || []).some(r => this.roles().some(role => role === r));
      this.updateView();
    });
  }

  @Input()
  set shaHasRoleElse(templateRef: TemplateRef<any> | null) {
    this.elseTemplateRef = templateRef;
    this.elseViewRef = null;  // clear previous view if any.
    this.updateView();
  }

  @Input() set shaHasRole(roles: string | string[]) {
    this.roles.set(Array.isArray(roles) ? roles : [roles]);
  }

  private updateView() {
    if (this.condition) {
      if (!this.thenViewRef) {
        this.viewContainer.clear();
        this.elseViewRef = null;
        this.thenViewRef = this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      if (!this.elseViewRef) {
        this.viewContainer.clear();
        this.thenViewRef = null;
        if (this.elseTemplateRef) {
          this.elseViewRef = this.viewContainer.createEmbeddedView(this.elseTemplateRef);
        }
      }
    }
  }
}
