import { Injectable } from '@angular/core';
import { ErgastService } from '@f2020/api';
import { ErgastDriversQualifying, ErgastRaceResult, finished, IDriverResult, IDriverStanding, mapper, IQualifyResult } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class StandingService {

  constructor(private service: ErgastService) {
  }

  getStandings(seasonId: string | number): Observable<IDriverStanding[]> {
    return this.service.get(`${seasonId}/driverStandings.json`, ergastData => mapper.driverStandings(ergastData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []));
  }

  getDriverResult(seasonId: string | number, driverId: string): Observable<IDriverResult> {
    return this.service.get<ErgastRaceResult[]>(`${seasonId}/drivers/${driverId}/results.json`, result => result.MRData.RaceTable.Races).pipe(
      map(raceResults => {
        const races = raceResults.map(mapper.raceResult);
        return <IDriverResult>{
          races,
          retired: races.reduce((acc, race) => acc += (finished(race.results[0].status) ? 0 : 1), 0),
          averageFinishPosition: races.reduce((acc, race) => acc + race.results[0].position, 0) / races.length,
          averageGridPosition: races.reduce((acc, race) => acc + race.results[0].grid, 0) / races.length,
        };
      }),
    );
  }

  getDriverQualify(seasonId: string | number, driverId: string): Observable<IQualifyResult[]> {
    return this.service.get<ErgastDriversQualifying[]>(`${seasonId}/drivers/${driverId}/qualifying.json`, result => result.MRData.RaceTable.Races).pipe(
      map(qualifyings => qualifyings.map(mapper.qualifyResult)),
    );
  }
}
