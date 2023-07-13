import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { ErgastService } from '@f2020/api';
import { ErgastDriversQualifying, ErgastRaceResult, IDriverResult, IDriverStanding, IQualifyResult, converter, finished, mapper } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StandingService {

  constructor(private service: ErgastService, private afs: Firestore) {
  }

  getStandings(seasonId: string | number): Observable<IDriverStanding[]> {
    return docData(doc(this.afs, `seasons/${seasonId}/standings/all-drivers`).withConverter(converter.timestamp<{ standing: IDriverStanding[]; }>())).pipe(
      map(({ standing }) => standing)
    );
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
