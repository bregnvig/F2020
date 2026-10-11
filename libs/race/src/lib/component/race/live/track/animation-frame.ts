import { DestroyRef, ElementRef, inject, Signal, signal } from '@angular/core';

/** A dialog's component has `display: contents` and no box of its own, so it is visible when one of its children is */
const isVisible = (element: Element): boolean =>
  element.checkVisibility() || (getComputedStyle(element).display === 'contents' && [...element.children].some(isVisible));

/**
 * The time of the current animation frame, so what depends on it is worked out for every frame.
 * It stands still while the host element is hidden, so a hidden map costs nothing
 */
export const animationFrame = (): Signal<number> => {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const time = signal(performance.now());
  let frame = requestAnimationFrame(function step(now) {
    isVisible(element) && time.set(now);
    frame = requestAnimationFrame(step);
  });
  inject(DestroyRef).onDestroy(() => cancelAnimationFrame(frame));
  return time.asReadonly();
};
