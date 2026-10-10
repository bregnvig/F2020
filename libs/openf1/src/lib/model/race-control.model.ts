export interface RaceControl {
  category: string;
  date: string;
  driver_number: number | null;
  flag: string;
  lap_number: number | null;
  meeting_key: number;
  message: string;
  /** The part of a qualifying, 1 to 3 */
  qualifying_phase?: number | null;
  scope: string;
  sector: number | null;
  session_key: number;
}