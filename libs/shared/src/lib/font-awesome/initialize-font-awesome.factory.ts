
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
// import { fad } from '@fortawesome/pro-duotone-svg-icons';
// import { fal } from '@fortawesome/pro-light-svg-icons';
import { faBookAlt, faCalendarAlt, faCarCrash, faGavel, faInfo, faPiggyBank, faPlus, faSignInAlt, faSignOutAlt, faSunCloud, faTrash, faTrophyAlt as farTrophyAlt, faUniversity, faUser, faUserFriends, faUserPlus } from '@fortawesome/pro-regular-svg-icons';
import { faCoins, faFlagCheckered, faHome, faPeopleGroup, faStar, faSteeringWheel, faTrophyAlt as fasTrophyAlt, faUserAstronaut } from '@fortawesome/pro-solid-svg-icons';
import { faRocketLaunch, faTireFlat } from '@fortawesome/pro-light-svg-icons';
import { faGoogle, faCss3, faFacebookF, faApple } from '@fortawesome/free-brands-svg-icons';

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
  faCarCrash,
  faUniversity,
  faGavel,
  faUserPlus
];

const fasIcons = [
  fasTrophyAlt,
  faHome,
  faFlagCheckered,
  faCoins,
  faSteeringWheel,
  faPeopleGroup,
  faUserAstronaut,
  faStar,

];

const falIcons = [
  faRocketLaunch,
  faTireFlat,
];

const fabIcons = [
  faGoogle,
  faFacebookF,
  faApple,
  faCss3,
];

export function initializeFontAwesomeFactory(faIconLibrary: FaIconLibrary) {
  return () => new Promise<any>((resolve: any) => {
    faIconLibrary.addIcons(...fasIcons, ...farIcons, ...falIcons, ...fabIcons);
    resolve();
  });
}
