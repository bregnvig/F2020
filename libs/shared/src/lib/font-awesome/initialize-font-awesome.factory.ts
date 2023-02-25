
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
// import { fad } from '@fortawesome/pro-duotone-svg-icons';
// import { fal } from '@fortawesome/pro-light-svg-icons';
import { faCalendarAlt, faSunCloud, faTrophyAlt as farTrophyAlt } from '@fortawesome/pro-regular-svg-icons';
import { faTrophyAlt as fasTrophyAlt } from '@fortawesome/pro-solid-svg-icons';
import { faRocketLaunch } from '@fortawesome/pro-light-svg-icons';

const farIcons = [
  faSunCloud,
  faCalendarAlt,
  farTrophyAlt
];

const fasIcons = [
  fasTrophyAlt,
];

const falIcons = [
  faRocketLaunch,
];

export function initializeFontAwesomeFactory(faIconLibrary: FaIconLibrary) {
  return () => new Promise<any>((resolve: any) => {
    faIconLibrary.addIcons(...fasIcons, ...farIcons, ...falIcons);
    resolve();
  });
}
