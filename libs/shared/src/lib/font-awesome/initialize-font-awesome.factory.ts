
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
// import { fad } from '@fortawesome/pro-duotone-svg-icons';
// import { fal } from '@fortawesome/pro-light-svg-icons';
import { faApple, faCss3, faFacebookF, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faRocketLaunch, faTireFlat } from '@fortawesome/pro-light-svg-icons';
import { faBookAlt, faCalendarAlt, faCarCrash, faEgg, faFaceSadCry, faGavel, faInfo, faPen, faPiggyBank, faPlus, faSignInAlt, faSignOutAlt, faSunCloud, faTrash, faUniversity, faUser, faUserFriends, faUserPlus, faTrophyAlt as farTrophyAlt } from '@fortawesome/pro-regular-svg-icons';
import { faCoins, faFlagCheckered, faHome, faPeopleGroup, faStar, faSteeringWheel, faUserAstronaut, faTrophyAlt as fasTrophyAlt } from '@fortawesome/pro-solid-svg-icons';

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
  faUserPlus,
  faFaceSadCry,
  faEgg,
  faPen,
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
