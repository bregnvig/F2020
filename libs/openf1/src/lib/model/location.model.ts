/** The position of a car about 3.7 times a second, in the coordinates of the circuit. The y axis points up */
export interface Location {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
}
