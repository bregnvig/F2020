import { Inject, Injectable } from "@angular/core";
import { GoogleFunctions } from '@f2020/firebase';
import firebase from 'firebase/compat/app';
import { interval, Observable } from 'rxjs';
import { first, map, switchMapTo } from 'rxjs/operators';

export interface IVersion {
  ui?: number;
  api?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  versionOK$: Observable<boolean>;

  constructor(@Inject(GoogleFunctions) functions: firebase.functions.Functions) {
    this.versionOK$ = interval(5000).pipe(
      switchMapTo(functions.httpsCallable('version')()),
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