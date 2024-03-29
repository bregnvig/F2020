import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

type Icon =
  | 'farWeather'
  | 'farCalendar'
  | 'fasTrophy'
  | 'farTrophy'
  | 'falRocketLaunch'
  | 'farPiggyBank'
  | 'farUserFriends'
  | 'farBookAlt'
  | 'farUser'
  | 'farInfo'
  | 'farSignOutAlt'
  | 'farSignInAlt'
  | 'farTrash'
  | 'farPlus'
  | 'farCarCrash'
  | 'farUniversity'
  | 'farGavel'
  | 'farUserPlus'
  | 'farFaceSadCry'
  | 'farEgg'
  | 'farPen'
  | 'farClock'
  | 'farChartLineUpDown'
  | 'fasHome'
  | 'fasPaperPlane'
  | 'fasFlagCheckered'
  | 'fasCoins'
  | 'fasSteeringWheel'
  | 'fasPeopleGroup'
  | 'fasUserAstronaut'
  | 'fasStar'
  | 'fasBars'
  | 'falTireFlat'
  | 'fabGoogle'
  | 'fabFacebookF'
  | 'fabApple'
  | 'fabCss3'
  | 'farCloudArrowDown'
  | 'farCloudArrowUp'
  | 'fasRotateRight'
  ;

export const icon: Record<Icon, [IconPrefix, IconName]> = {
  farWeather: ['far', 'sun-cloud'],
  farCalendar: ['far', 'calendar-alt'],
  fasTrophy: ['fas', 'trophy-alt'],
  farTrophy: ['far', 'trophy-alt'],
  falRocketLaunch: ['fal', 'rocket-launch'],
  farPiggyBank: ['far', 'piggy-bank'],
  farUserFriends: ['far', 'user-friends'],
  farBookAlt: ['far', 'book-alt'],
  farUser: ['far', 'user'],
  farInfo: ['far', 'info'],
  farSignOutAlt: ['far', 'sign-out-alt'],
  farSignInAlt: ['far', 'sign-in-alt'],
  farTrash: ['far', 'trash'],
  farCarCrash: ['far', 'car-crash'],
  farUniversity: ['far', 'university'],
  farGavel: ['far', 'gavel'],
  farPlus: ['far', 'plus'],
  farUserPlus: ['far', 'user-plus'],
  farEgg: ['far', 'egg'],
  farPen: ['far', 'pen'],
  fasHome: ['fas', 'home'],
  fasFlagCheckered: ['fas', 'flag-checkered'],
  fasCoins: ['fas', 'coins'],
  fasSteeringWheel: ['fas', 'steering-wheel'],
  fasPeopleGroup: ['fas', 'people-group'],
  fasUserAstronaut: ['fas', 'user-astronaut'],
  fasStar: ['fas', 'star'],
  fasBars: ['fas', 'bars'],
  fasRotateRight: ['fas', 'rotate-right'],
  falTireFlat: ['fal', 'tire-flat'],
  fabGoogle: ['fab', 'google'],
  fabFacebookF: ['fab', 'facebook-f'],
  fabApple: ['fab', 'apple'],
  fabCss3: ['fab', 'css3'],
  farFaceSadCry: ['far', 'face-sad-cry'],
  farChartLineUpDown: ['far', 'chart-line-up-down'],
  farCloudArrowDown: ['fas', 'cloud-arrow-down'],
  farCloudArrowUp: ['fas', 'cloud-arrow-up'],
  fasPaperPlane: ['fas', 'paper-plane'],
  farClock: ['far', 'clock'],
};