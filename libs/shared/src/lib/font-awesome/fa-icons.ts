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
  | 'fasHome'
  | 'fasFlagCheckered'
  | 'fasCoins'
  | 'fasSteeringWheel'
  | 'fasPeopleGroup'
  | 'fasUserAstronaut'
  | 'falTireFlat'
  | 'fabGoogle'
  | 'fabFacebookF'
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
  farPlus: ['far', 'plus'],
  fasHome: ['fas', 'home'],
  fasFlagCheckered: ['fas', 'flag-checkered'],
  fasCoins: ['fas', 'coins'],
  fasSteeringWheel: ['fas', 'steering-wheel'],
  fasPeopleGroup: ['fas', 'people-group'],
  fasUserAstronaut: ['fas', 'user-astronaut'],
  falTireFlat: ['fal', 'tire-flat'],
  fabGoogle: ['fab', 'google'],
  fabFacebookF: ['fab', 'facebook-f'],
};