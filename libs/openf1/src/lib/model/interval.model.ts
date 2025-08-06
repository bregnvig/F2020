export interface Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number;
  interval: number | null | `+${number} LAP`;
  meeting_key: number;
  session_key: number;
}
