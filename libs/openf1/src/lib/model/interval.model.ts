export type Gap = number | null | `+${number} LAP`;

export interface Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number;
  interval: Gap;
  meeting_key: number;
  session_key: number;
}
