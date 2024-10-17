import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faApple, faCss3, faFacebookF, faFirefoxBrowser, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faRocketLaunch, faTireFlat } from '@fortawesome/pro-light-svg-icons';
import {
  faBookAlt,
  faCalendarAlt,
  faCarCrash,
  faChartLineUpDown,
  faClock,
  faEgg,
  faFaceSadCry,
  faGavel,
  faInfo,
  faLocationDot,
  faPen,
  faPiggyBank,
  faPlus,
  faSignInAlt,
  faSignOutAlt,
  faSunCloud,
  faTrash,
  faTrophyAlt as farTrophyAlt,
  faUniversity,
  faUser,
  faUserFriends,
  faUserPlus,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faBars,
  faCloudArrowDown,
  faCloudArrowUp,
  faCoins,
  faFlagCheckered,
  faHome,
  faPaperPlane,
  faPeopleGroup,
  faRotateRight,
  faStar,
  faSteeringWheel,
  faTrophyAlt as fasTrophyAlt,
  faUserAstronaut,
} from '@fortawesome/pro-solid-svg-icons';

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
  faChartLineUpDown,
  faClock,
  faLocationDot,
];

const fasIcons = [
  faPaperPlane,
  faCloudArrowDown,
  faCloudArrowUp,
  fasTrophyAlt,
  faHome,
  faFlagCheckered,
  faCoins,
  faSteeringWheel,
  faPeopleGroup,
  faUserAstronaut,
  faStar,
  faBars,
  faRotateRight,
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
  faFirefoxBrowser,
];

export function initializeFontAwesomeFactory(faIconLibrary: FaIconLibrary) {
  return () => new Promise<any>((resolve: any) => {
    faIconLibrary.addIcons(...fasIcons, ...farIcons, ...falIcons, ...fabIcons);
    resolve();
  });
}
