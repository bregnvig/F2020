import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

@Pipe({
  name: 'dateTime'
})
export class DateTimePipe implements PipeTransform {

  constructor(private datePipe: DatePipe) {
  }

  transform(value: DateTime, format: string): any {
    if (!value || (value && value.year === 1)) {
      return '';
    }
    return this.datePipe.transform(+value, format);
  }
}
