import { ErgastRaceResult } from '../model';
import { IRaceResult } from './../model/race.model';
import { driverResult } from './driver-result.mapper';
import { basisMap } from './race.mapper';

export const map = (source: ErgastRaceResult): IRaceResult => {
  return {
    ...basisMap(source),
    results: source.Results.map(driverResult)
  }
}

// export const mapToBid = (source: IRaceResult, ): Bid => {
//   return <Bid> {
//     qualify: source.
//   }
// } 
