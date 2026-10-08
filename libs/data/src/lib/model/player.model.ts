import { DateTime } from "luxon";

export type Role = 'player' | 'admin' | 'bookie' | 'bank-admin' | 'anonymous';

/** The cards on the landing page */
export type LandingCard = 'what-else' | 'remember-to-play' | 'previous-race' | 'wbc' | 'drivers' | 'teams' | 'join-wbc' | 'last-year' | 'weather';

/** The cards on the landing page in the order they are shown */
export const landingCards: { card: LandingCard; title: string }[] = [
  { card: 'what-else', title: 'Hvad er nyt' },
  { card: 'remember-to-play', title: 'Husk at spille' },
  { card: 'previous-race', title: 'Seneste resultat' },
  { card: 'wbc', title: 'WBC' },
  { card: 'drivers', title: 'Kørermesterskabet' },
  { card: 'teams', title: 'Konstruktørmesterskabet' },
  { card: 'join-wbc', title: 'Deltag i WBC' },
  { card: 'last-year', title: 'Sidste år' },
  { card: 'weather', title: 'Vejret' },
];

/** The cards hidden on the landing page. When every card is hidden none are */
export const hiddenLandingCards = (player?: Pick<Player, 'hiddenLandingCards'>): LandingCard[] => {
  const hidden = player?.hiddenLandingCards ?? [];
  return landingCards.every(c => hidden.includes(c.card)) ? [] : hidden;
};

export interface Player {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  roles?: Role[];
  tokens?: string[];
  receiveReminders?: boolean;
  receiveBettingStarted?: string[];
  /** Cards hidden on the landing page. All are shown when missing, so new cards are shown by default */
  hiddenLandingCards?: LandingCard[];
  balance?: number;
  almostTimeReminder?: DateTime;
}
