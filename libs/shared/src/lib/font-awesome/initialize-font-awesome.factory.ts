
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
// import { fad } from '@fortawesome/pro-duotone-svg-icons';
// import { fal } from '@fortawesome/pro-light-svg-icons';
import { faBookAlt, faCalendarAlt, faInfo, faPiggyBank, faPlus, faSignInAlt, faSignOutAlt, faSunCloud, faTrash, faTrophyAlt as farTrophyAlt, faUser, faUserFriends } from '@fortawesome/pro-regular-svg-icons';
import { faCoins, faFlagCheckered, faHome, faPeopleGroup, faSteeringWheel, faTrophyAlt as fasTrophyAlt, faUserAstronaut } from '@fortawesome/pro-solid-svg-icons';
import { faRocketLaunch, faTireFlat } from '@fortawesome/pro-light-svg-icons';
import { faGoogle, faFacebook, faFacebookF } from '@fortawesome/free-brands-svg-icons';

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
  faTrash,
  faPlus,
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
  faTireFlat,
];

const fabIcons = [
  faGoogle,
  faFacebookF,
];

export function initializeFontAwesomeFactory(faIconLibrary: FaIconLibrary) {
  return () => new Promise<any>((resolve: any) => {
    faIconLibrary.addIcons(...fasIcons, ...farIcons, ...falIcons, ...fabIcons);
    resolve();
  });
}
