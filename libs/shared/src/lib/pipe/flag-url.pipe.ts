import { Pipe, PipeTransform } from "@angular/core";
import { IRace } from '@f2020/data';

@Pipe({
  name: 'flagURL'
})
export class FlagURLPipe implements PipeTransform {
  
  transform(value: IRace | string): string {
    if (!value) {
      return '';
    }
    const flag = typeof value === 'string' ? value : value.countryCode;
    return `https://www.countryflags.io/${flag.toLocaleLowerCase()}/flat/64.png`
  }
  
}
