import { ComponentType } from '@angular/cdk/portal';
import { inject, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

/** Opens a component in fullscreen. The injector of the card is passed on, so the fullscreen uses the same live or relive data */
export const injectOpenFullscreen = () => {
  const dialog = inject(MatDialog);
  const injector = inject(Injector);
  return <C, D>(component: ComponentType<C>, data: D) =>
    dialog.open<C, D>(component, {
      data,
      injector,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });
};
