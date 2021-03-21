import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { SeasonActions, SeasonFacade } from '../+state';

@Injectable({
  providedIn: 'root'
})
export class SeasonLoaderService implements CanActivate {

  constructor(private facade: SeasonFacade) {
  }
  canActivate(route: ActivatedRouteSnapshot): true {
    this.facade.dispatch(SeasonActions.loadSeason({ seasonId: route.params['season'] }));
    return true;
  }


}