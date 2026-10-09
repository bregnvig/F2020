import { IDriver } from '@f2020/data';

/**
 * Images from the formula1.com media library. It is not an official API, so the paths may break.
 */
const mediaUrl = 'https://media.formula1.com/image/upload';

/** The team name as OpenF1 has it, in lower case without spaces, e.g. Haas F1 Team is haasf1team */
const teamSlug = (teamName: string) => teamName.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The reference of the driver, e.g. lannor01 for Lando Norris. Taken from the OpenF1 headshot, which has it even when there is no photo.
 * Otherwise three letters of the first and last name.
 */
const driverRef = ({ headshotUrl, name }: IDriver): string | undefined => {
  const fromHeadshot = headshotUrl?.match(/\/([a-z]{6}\d{2})\.png/i)?.[1];
  if (fromHeadshot) {
    return fromHeadshot.toLowerCase();
  }
  const names = name.normalize('NFD').replace(/[^a-zA-Z ]/g, '').toLowerCase().split(' ').filter(n => !!n);
  return names.length > 1 && names[0].length >= 3 && names.at(-1).length >= 3 ? `${names[0].slice(0, 3)}${names.at(-1).slice(0, 3)}01` : undefined;
};

export const teamLogoUrl = (seasonId: string | number, teamName: string): string => {
  const slug = teamSlug(teamName);
  return `${mediaUrl}/c_lfill,w_96/q_auto/v1740000001/common/f1/${seasonId}/${slug}/${seasonId}${slug}logo.webp`;
};

/**
 * The face of the driver cropped from the photo of the season. Undefined when the team or reference of the driver is unknown.
 */
export const driverHeadshotUrl = (seasonId: string | number, driver: IDriver, size: number): string | undefined => {
  const ref = driverRef(driver);
  if (!ref || !driver.teamName) {
    return undefined;
  }
  const slug = teamSlug(driver.teamName);
  return `${mediaUrl}/c_thumb,g_face,w_${size},h_${size},z_0.7/q_auto/v1740000001/common/f1/${seasonId}/${slug}/${ref}/${seasonId}${slug}${ref}right.webp`;
};
