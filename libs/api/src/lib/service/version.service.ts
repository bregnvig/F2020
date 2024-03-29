import { Injectable } from "@angular/core";
import { Functions, httpsCallable } from '@angular/fire/functions';
import { interval, Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

export interface IVersion {
  ui?: number;
  api?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  versionOK$: Observable<boolean>;

  constructor(functions: Functions) {
    this.versionOK$ = interval(5000).pipe(
      switchMap(() => httpsCallable(functions, 'version')()),
      first(),
      map(result => result.data),
      map((expected: IVersion) => ({
        expected,
        actual: this.getVersion()
      })),
      map(versions => {
        const uiOK = versions.actual.ui === versions.expected.ui;
        const apiOK = versions.actual.api === versions.expected.api;
        return uiOK && apiOK || window.location.href.startsWith('http://localhost');
      })
    );
  }

  setVersion(version: IVersion) {
    localStorage.setItem('version', JSON.stringify(version));
  }

  private getVersion(): IVersion {
    return JSON.parse(localStorage.getItem('version')) || {};
  }
}