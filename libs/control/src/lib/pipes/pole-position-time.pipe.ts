import { Pipe, PipeTransform } from '@angular/core';
import { mapper } from '@f2020/data';

@Pipe({
  name: 'polePositionTime'
})
export class PolePositionTimePipe implements PipeTransform {

  transform(value: number): string {
    const pole = mapper.polePostion.split(value);
    return `${pole.minutes}:${pole.seconds.toString().padStart(2, '0')}.${pole.milliseconds.toString().padStart(3, '0')}`;
  }

}
