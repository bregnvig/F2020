import { DateTime } from 'luxon';
import { Bid } from '@f2020/data';
import { buildResult } from './result-builder';

const race = { "name": "Australian Grand Prix", "raceStart": DateTime.fromISO("2019-03-17T06:10:00.000+01:00"), "countryCode": "AU", "location": { "lat": -37.8497, "lng": 144.968, "nationality": "Melbourne", "country": "Australia" }, "url": "https://en.wikipedia.org/wiki/2019_Australian_Grand_Prix", "season": 2019, "round": 1, "results": [{ "driver": { "driverId": "bottas", "code": "BOT", "nationality": "Finnish", "name": "Valtteri Bottas", "permanentNumber": 77, "url": "http://en.wikipedia.org/wiki/Valtteri_Bottas" }, "points": 26, "position": 1, "grid": 2, "status": "Finished", "fastestLap": { "rank": 1, "lap": 57, "averageSpeed": 223.075, "time": 85580 } }, { "driver": { "driverId": "hamilton", "code": "HAM", "nationality": "British", "name": "Lewis Hamilton", "permanentNumber": 44, "url": "http://en.wikipedia.org/wiki/Lewis_Hamilton" }, "points": 18, "position": 2, "grid": 1, "status": "Finished", "fastestLap": { "rank": 2, "lap": 57, "averageSpeed": 221.839, "time": 86057 } }, { "driver": { "driverId": "max_verstappen", "code": "VER", "nationality": "Dutch", "name": "Max Verstappen", "permanentNumber": 33, "url": "http://en.wikipedia.org/wiki/Max_Verstappen" }, "points": 15, "position": 3, "grid": 4, "status": "Finished", "fastestLap": { "rank": 3, "lap": 57, "averageSpeed": 221.327, "time": 86256 } }, { "driver": { "driverId": "vettel", "code": "VET", "nationality": "German", "name": "Sebastian Vettel", "permanentNumber": 5, "url": "http://en.wikipedia.org/wiki/Sebastian_Vettel" }, "points": 12, "position": 4, "grid": 3, "status": "Finished", "fastestLap": { "rank": 8, "lap": 16, "averageSpeed": 217.054, "time": 87954 } }, { "driver": { "driverId": "leclerc", "code": "LEC", "nationality": "Monegasque", "name": "Charles Leclerc", "permanentNumber": 16, "url": "http://en.wikipedia.org/wiki/Charles_Leclerc" }, "points": 10, "position": 5, "grid": 5, "status": "Finished", "fastestLap": { "rank": 4, "lap": 58, "averageSpeed": 219.621, "time": 86926 } }, { "driver": { "driverId": "kevin_magnussen", "code": "MAG", "nationality": "Danish", "name": "Kevin Magnussen", "permanentNumber": 20, "url": "http://en.wikipedia.org/wiki/Kevin_Magnussen" }, "points": 8, "position": 6, "grid": 7, "status": "Finished", "fastestLap": { "rank": 9, "lap": 56, "averageSpeed": 216.493, "time": 88182 } }, { "driver": { "driverId": "hulkenberg", "code": "HUL", "nationality": "German", "name": "Nico Hülkenberg", "permanentNumber": 27, "url": "http://en.wikipedia.org/wiki/Nico_H%C3%BClkenberg" }, "points": 6, "position": 7, "grid": 11, "status": "+1 Lap", "fastestLap": { "rank": 12, "lap": 52, "averageSpeed": 215.851, "time": 88444 } }, { "driver": { "driverId": "raikkonen", "code": "RAI", "nationality": "Finnish", "name": "Kimi Räikkönen", "permanentNumber": 7, "url": "http://en.wikipedia.org/wiki/Kimi_R%C3%A4ikk%C3%B6nen" }, "points": 4, "position": 8, "grid": 9, "status": "+1 Lap", "fastestLap": { "rank": 11, "lap": 52, "averageSpeed": 216.277, "time": 88270 } }, { "driver": { "driverId": "stroll", "code": "STR", "nationality": "Canadian", "name": "Lance Stroll", "permanentNumber": 18, "url": "http://en.wikipedia.org/wiki/Lance_Stroll" }, "points": 2, "position": 9, "grid": 16, "status": "+1 Lap", "fastestLap": { "rank": 7, "lap": 29, "averageSpeed": 218.011, "time": 87568 } }, { "driver": { "driverId": "kvyat", "code": "KVY", "nationality": "Russian", "name": "Daniil Kvyat", "permanentNumber": 26, "url": "http://en.wikipedia.org/wiki/Daniil_Kvyat" }, "points": 1, "position": 10, "grid": 15, "status": "+1 Lap", "fastestLap": { "rank": 6, "lap": 39, "averageSpeed": 218.31, "time": 87448 } }, { "driver": { "driverId": "gasly", "code": "GAS", "nationality": "French", "name": "Pierre Gasly", "permanentNumber": 10, "url": "http://en.wikipedia.org/wiki/Pierre_Gasly" }, "points": 0, "position": 11, "grid": 17, "status": "+1 Lap", "fastestLap": { "rank": 5, "lap": 39, "averageSpeed": 218.858, "time": 87229 } }, { "driver": { "driverId": "norris", "code": "NOR", "nationality": "British", "name": "Lando Norris", "permanentNumber": 4, "url": "http://en.wikipedia.org/wiki/Lando_Norris" }, "points": 0, "position": 12, "grid": 8, "status": "+1 Lap", "fastestLap": { "rank": 16, "lap": 17, "averageSpeed": 215.581, "time": 88555 } }, { "driver": { "driverId": "perez", "code": "PER", "nationality": "Mexican", "name": "Sergio Pérez", "permanentNumber": 11, "url": "http://en.wikipedia.org/wiki/Sergio_P%C3%A9rez" }, "points": 0, "position": 13, "grid": 10, "status": "+1 Lap", "fastestLap": { "rank": 15, "lap": 41, "averageSpeed": 215.751, "time": 88485 } }, { "driver": { "driverId": "albon", "code": "ALB", "nationality": "Thai", "name": "Alexander Albon", "permanentNumber": 23, "url": "http://en.wikipedia.org/wiki/Alexander_Albon" }, "points": 0, "position": 14, "grid": 13, "status": "+1 Lap", "fastestLap": { "rank": 10, "lap": 43, "averageSpeed": 216.478, "time": 88188 } }, { "driver": { "driverId": "giovinazzi", "code": "GIO", "nationality": "Italian", "name": "Antonio Giovinazzi", "permanentNumber": 99, "url": "http://en.wikipedia.org/wiki/Antonio_Giovinazzi" }, "points": 0, "position": 15, "grid": 14, "status": "+1 Lap", "fastestLap": { "rank": 14, "lap": 29, "averageSpeed": 215.766, "time": 88479 } }, { "driver": { "driverId": "russell", "code": "RUS", "nationality": "British", "name": "George Russell", "permanentNumber": 63, "url": "http://en.wikipedia.org/wiki/George_Russell_(racing_driver)" }, "points": 0, "position": 16, "grid": 19, "status": "+2 Laps", "fastestLap": { "rank": 17, "lap": 55, "averageSpeed": 215.197, "time": 88713 } }, { "driver": { "driverId": "kubica", "code": "KUB", "nationality": "Polish", "name": "Robert Kubica", "permanentNumber": 88, "url": "http://en.wikipedia.org/wiki/Robert_Kubica" }, "points": 0, "position": 17, "grid": 20, "status": "+3 Laps", "fastestLap": { "rank": 18, "lap": 30, "averageSpeed": 213.821, "time": 89284 } }, { "driver": { "driverId": "grosjean", "code": "GRO", "nationality": "French", "name": "Romain Grosjean", "permanentNumber": 8, "url": "http://en.wikipedia.org/wiki/Romain_Grosjean" }, "points": 0, "position": 18, "grid": 6, "status": "Wheel", "fastestLap": { "rank": 13, "lap": 17, "averageSpeed": 215.807, "time": 88462 } }, { "driver": { "driverId": "ricciardo", "code": "RIC", "nationality": "Australian", "name": "Daniel Ricciardo", "permanentNumber": 3, "url": "http://en.wikipedia.org/wiki/Daniel_Ricciardo" }, "points": 0, "position": 19, "grid": 12, "status": "Damage", "fastestLap": { "rank": 19, "lap": 18, "averageSpeed": 212.478, "time": 89848 } }, { "driver": { "driverId": "sainz", "code": "SAI", "nationality": "Spanish", "name": "Carlos Sainz", "permanentNumber": 55, "url": "http://en.wikipedia.org/wiki/Carlos_Sainz_Jr." }, "points": 0, "position": 20, "grid": 18, "status": "Engine", "fastestLap": { "rank": 20, "lap": 9, "averageSpeed": 210.022, "time": 90899 } }] }
const qualify = { "name": "Australian Grand Prix", "raceStart": DateTime.fromISO("2019-03-17T06:10:00.000+01:00"), "countryCode": "AU", "location": { "lat": -37.8497, "lng": 144.968, "nationality": "Melbourne", "country": "Australia" }, "url": "https://en.wikipedia.org/wiki/2019_Australian_Grand_Prix", "season": 2019, "round": 1, "results": [{ "driver": { "driverId": "hamilton", "code": "HAM", "nationality": "British", "name": "Lewis Hamilton", "permanentNumber": 44, "url": "http://en.wikipedia.org/wiki/Lewis_Hamilton" }, "position": 1, "q1": 82043, "q2": 81014, "q3": 80486 }, { "driver": { "driverId": "bottas", "code": "BOT", "nationality": "Finnish", "name": "Valtteri Bottas", "permanentNumber": 77, "url": "http://en.wikipedia.org/wiki/Valtteri_Bottas" }, "position": 2, "q1": 82367, "q2": 81193, "q3": 80598 }, { "driver": { "driverId": "vettel", "code": "VET", "nationality": "German", "name": "Sebastian Vettel", "permanentNumber": 5, "url": "http://en.wikipedia.org/wiki/Sebastian_Vettel" }, "position": 3, "q1": 82885, "q2": 81912, "q3": 81190 }, { "driver": { "driverId": "max_verstappen", "code": "VER", "nationality": "Dutch", "name": "Max Verstappen", "permanentNumber": 33, "url": "http://en.wikipedia.org/wiki/Max_Verstappen" }, "position": 4, "q1": 82876, "q2": 81678, "q3": 81320 }, { "driver": { "driverId": "leclerc", "code": "LEC", "nationality": "Monegasque", "name": "Charles Leclerc", "permanentNumber": 16, "url": "http://en.wikipedia.org/wiki/Charles_Leclerc" }, "position": 5, "q1": 82017, "q2": 81739, "q3": 81442 }, { "driver": { "driverId": "grosjean", "code": "GRO", "nationality": "French", "name": "Romain Grosjean", "permanentNumber": 8, "url": "http://en.wikipedia.org/wiki/Romain_Grosjean" }, "position": 6, "q1": 82959, "q2": 81870, "q3": 81826 }, { "driver": { "driverId": "kevin_magnussen", "code": "MAG", "nationality": "Danish", "name": "Kevin Magnussen", "permanentNumber": 20, "url": "http://en.wikipedia.org/wiki/Kevin_Magnussen" }, "position": 7, "q1": 82519, "q2": 82221, "q3": 82099 }, { "driver": { "driverId": "norris", "code": "NOR", "nationality": "British", "name": "Lando Norris", "permanentNumber": 4, "url": "http://en.wikipedia.org/wiki/Lando_Norris" }, "position": 8, "q1": 82702, "q2": 82423, "q3": 82304 }, { "driver": { "driverId": "raikkonen", "code": "RAI", "nationality": "Finnish", "name": "Kimi Räikkönen", "permanentNumber": 7, "url": "http://en.wikipedia.org/wiki/Kimi_R%C3%A4ikk%C3%B6nen" }, "position": 9, "q1": 82966, "q2": 82349, "q3": 82314 }, { "driver": { "driverId": "perez", "code": "PER", "nationality": "Mexican", "name": "Sergio Pérez", "permanentNumber": 11, "url": "http://en.wikipedia.org/wiki/Sergio_P%C3%A9rez" }, "position": 10, "q1": 82908, "q2": 82532, "q3": 82781 }, { "driver": { "driverId": "hulkenberg", "code": "HUL", "nationality": "German", "name": "Nico Hülkenberg", "permanentNumber": 27, "url": "http://en.wikipedia.org/wiki/Nico_H%C3%BClkenberg" }, "position": 11, "q1": 82540, "q2": 82562 }, { "driver": { "driverId": "ricciardo", "code": "RIC", "nationality": "Australian", "name": "Daniel Ricciardo", "permanentNumber": 3, "url": "http://en.wikipedia.org/wiki/Daniel_Ricciardo" }, "position": 12, "q1": 82921, "q2": 82570 }, { "driver": { "driverId": "albon", "code": "ALB", "nationality": "Thai", "name": "Alexander Albon", "permanentNumber": 23, "url": "http://en.wikipedia.org/wiki/Alexander_Albon" }, "position": 13, "q1": 82757, "q2": 82636 }, { "driver": { "driverId": "giovinazzi", "code": "GIO", "nationality": "Italian", "name": "Antonio Giovinazzi", "permanentNumber": 99, "url": "http://en.wikipedia.org/wiki/Antonio_Giovinazzi" }, "position": 14, "q1": 82431, "q2": 82714 }, { "driver": { "driverId": "kvyat", "code": "KVY", "nationality": "Russian", "name": "Daniil Kvyat", "permanentNumber": 26, "url": "http://en.wikipedia.org/wiki/Daniil_Kvyat" }, "position": 15, "q1": 82511, "q2": 82774 }, { "driver": { "driverId": "stroll", "code": "STR", "nationality": "Canadian", "name": "Lance Stroll", "permanentNumber": 18, "url": "http://en.wikipedia.org/wiki/Lance_Stroll" }, "position": 16, "q1": 83017 }, { "driver": { "driverId": "gasly", "code": "GAS", "nationality": "French", "name": "Pierre Gasly", "permanentNumber": 10, "url": "http://en.wikipedia.org/wiki/Pierre_Gasly" }, "position": 17, "q1": 83020 }, { "driver": { "driverId": "sainz", "code": "SAI", "nationality": "Spanish", "name": "Carlos Sainz", "permanentNumber": 55, "url": "http://en.wikipedia.org/wiki/Carlos_Sainz_Jr." }, "position": 18, "q1": 83084 }, { "driver": { "driverId": "russell", "code": "RUS", "nationality": "British", "name": "George Russell", "permanentNumber": 63, "url": "http://en.wikipedia.org/wiki/George_Russell_(racing_driver)" }, "position": 19, "q1": 84360 }, { "driver": { "driverId": "kubica", "code": "KUB", "nationality": "Polish", "name": "Robert Kubica", "permanentNumber": 88, "url": "http://en.wikipedia.org/wiki/Robert_Kubica" }, "position": 20, "q1": 86067 }] }
const selectedDriver = `max_verstappen`

describe('ResultBuilder', () => {

  let result: Bid;

  beforeEach(() => {
    result = buildResult(race, qualify, selectedDriver);
  })

  it('should create an instance', () => {
    expect(buildResult).toBeTruthy();
  });
  it('Qualify should contain 7 drivers in correct order', () => {
    expect(result.qualify.length).toBe(7);
    expect(result.qualify).toStrictEqual([
      'hamilton',
      'bottas',
      'vettel',
      'max_verstappen',
      'leclerc',
      'grosjean',
      'kevin_magnussen',
    ])
  })

  it('Fastest driver should contain 2 drivers in correct order', () => {
    expect(result.fastestDriver.length).toBe(2);
    expect(result.fastestDriver).toStrictEqual([
      'bottas',
      'hamilton',
    ])
  });
  
  it('Podium should contain 4 drivers in correct order', () => {
    expect(result.podium.length).toBe(4);
    expect(result.podium).toStrictEqual([
      'bottas',
      'hamilton',
      'max_verstappen',
      'vettel',
    ])
  })

  it('Selected driver, Max Verstappen, so have a grid of 4 and result of 3', () => {
    expect(result.selectedDriver).toBeTruthy();
    expect(result.selectedDriver.grid).toBe(4);
    expect(result.selectedDriver.finish).toBe(3);
  });

  it('First crash should contain 3 drivers in correct order', () => {
    expect(result.firstCrash.length).toBe(3);
    expect(result.firstCrash).toStrictEqual([
      'sainz',
      'ricciardo',
      'grosjean',
    ]);
  })

  it('Pole position time should be 1:20.486', () => {
    expect(result.polePositionTime).toBe(1 * 60 * 1000 + 20 * 1000 + 486);
  })


});

