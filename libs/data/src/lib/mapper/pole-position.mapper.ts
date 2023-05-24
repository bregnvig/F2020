import { PolePositionTime } from "../model/pole-position.model";


const minutes = (millis: number) => Math.floor(millis / (1000 * 60));
const seconds = (millis: number) => Math.floor((millis % (1000 * 60)) / 1000);
const milliseconds = (millis: number) => millis % 1000;

export const polePosition = {
  split(value: number): PolePositionTime {
    return {
      minutes: minutes(value),
      seconds: seconds(value),
      milliseconds: milliseconds(value)
    };
  },
  join(value: PolePositionTime): number {
    return ((value.minutes * 60) + value.seconds) * 1000 + value.milliseconds;
  }
};
