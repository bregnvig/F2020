import { IDriver, IStint, ITeam } from '../model';
import { Stint } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';

interface OpenF1StintParams {
  stints: Stint[];
  drivers: IDriver[];
}

const openF1Stints = (params: OpenF1StintParams) => {
  const drivers = params.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());

  return params.stints.map(stint => {
    const driver = requiredValue(drivers.get(stint.driver_number), 'Stint driver with driver number', stint.driver_number);
    return ({
      driver,
      compound: stint.compound,
      lapStart: stint.lap_start,
      lapEnd: stint.lap_end,
      stintNumber: stint.stint_number,
      tyreAgeAtStart: stint.tyre_age_at_start,
    });
  });
};

export function map(params: OpenF1StintParams): IStint[] {
  return openF1Stints(params);
}
