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
  | 'fasHome'
  | 'fasFlagCheckered'
  | 'fasCoins'
  | 'fasSteeringWheel'
  | 'fasPeopleGroup'
  | 'fasUserAstronaut'
  | 'fasStar'
  | 'falTireFlat'
  | 'fabGoogle'
  | 'fabFacebookF'
  | 'fabApple'
  | 'fabCss3'
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
  falTireFlat: ['fal', 'tire-flat'],
  fabGoogle: ['fab', 'google'],
  fabFacebookF: ['fab', 'facebook-f'],
  fabApple: ['fab', 'apple'],
  fabCss3: ['fab', 'css3'],
  farFaceSadCry: ['far', 'face-sad-cry'],
};