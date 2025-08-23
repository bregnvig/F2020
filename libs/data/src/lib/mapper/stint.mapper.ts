import { IDriver, IStint, ITeam, Tyre } from '../model';
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

  // Since stints are already sorted, just take the last entry for each driver
  const latestStintsByDriver = params.stints.reduce((acc, stint) => {
    acc.set(stint.driver_number, stint);
    return acc;
  }, new Map<number, Stint>());

  return Array.from(latestStintsByDriver.values()).map(stint => {
    const driver = requiredValue(drivers.get(stint.driver_number), 'Stint driver with driver number', stint.driver_number);
    return ({
      driver,
      compound: stint.compound as Tyre,
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
