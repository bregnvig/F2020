import { IDriver } from './';
import { SectorStatus } from '@f2020/openf1';

export type SectorColor = 'yellow' | 'green' | 'purple' | 'pitlane' | 'unknown';
export const SectorColorMap: Record<SectorStatus, SectorColor> = {
  2048: 'yellow',
  2049: 'green',
  2050: 'unknown',
  2051: 'purple',
  2052: 'unknown',
  2064: 'pitlane',
  2068: 'unknown',
};

export interface ISector {
  status?: SectorColor;
  mini?: SectorColor[];
}

export interface IDriverSector {
  driver: IDriver;
  sector1: ISector;
  sector2?: ISector;
  sector3?: ISector;
}
