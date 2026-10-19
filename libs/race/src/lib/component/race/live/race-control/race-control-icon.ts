import { icon } from '@f2020/shared';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

const icons: Record<string, [IconPrefix, IconName]> = {
  Drs: icon.falRocketLaunch,
  Flag: icon.fasFlagCheckered,
  SafetyCar: icon.fasSafetyCar,
  CarEvent: icon.farCarCrash,
  Other: icon.farInfo,
};

/** The icon of a race control message without a driver */
export const raceControlIcon = (category: string): [IconPrefix, IconName] => icons[category] ?? icon.fasFlagCheckered;
