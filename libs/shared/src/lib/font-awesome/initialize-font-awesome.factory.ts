
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
// import { fad } from '@fortawesome/pro-duotone-svg-icons';
// import { fal } from '@fortawesome/pro-light-svg-icons';
import { faBookAlt, faCalendarAlt, faInfo, faPiggyBank, faSignInAlt, faSignOutAlt, faSunCloud, faTrophyAlt as farTrophyAlt, faUser, faUserFriends } from '@fortawesome/pro-regular-svg-icons';
import { faCoins, faFlagCheckered, faHome, faPeopleGroup, faSteeringWheel, faTrophyAlt as fasTrophyAlt, faUserAstronaut } from '@fortawesome/pro-solid-svg-icons';
import { faRocketLaunch } from '@fortawesome/pro-light-svg-icons';

const farIcons = [
  faSunCloud,
  faCalendarAlt,
  farTrophyAlt,
  faPiggyBank,
  faUserFriends,
  faBookAlt,
  faUser,
  faInfo,
  faSignOutAlt,
  faSignInAlt,
];

const fasIcons = [
  fasTrophyAlt,
  faHome,
  faFlagCheckered,
  faCoins,
  faSteeringWheel,
  faPeopleGroup,
  faUserAstronaut,

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
