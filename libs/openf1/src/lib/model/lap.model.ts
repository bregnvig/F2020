export type SectorColor = 'yellow' | 'green' | 'purple' | 'pitlane' | 'unknown';
export type SectorStatus = 2048 | 2049 | 2050 | 2051 | 2052 | 2064 | 2068;
export const SectorColorMap: Record<SectorStatus, SectorColor> = {
  2048: 'yellow',
  2049: 'green',
  2050: 'unknown',
  2051: 'purple',
  2052: 'unknown',
  2064: 'pitlane',
  2068: 'unknown',
};

export interface Lap {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  i1_speed: number;
  i2_speed: number;
  st_speed: number;
  date_start: string;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  segments_sector_1: SectorStatus[],
  segments_sector_2: SectorStatus[],
  segments_sector_3: SectorStatus[],
  lap_number: number;
}
