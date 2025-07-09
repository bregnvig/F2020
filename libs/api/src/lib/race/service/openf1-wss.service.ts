import { inject } from '@angular/core';
import { OpenF1HttpService } from './openf1-http.service';



export class OpenF1WSSService {

  #openF1Http = inject(OpenF1HttpService);

  constructor() {

  }
}