import { inject, Service } from '@angular/core';
import { IRace, ITeam } from '@f2020/data';
import { RaceStore } from '@f2020/api';

@Service({ autoProvided: false })
export class RaceTeamsApi {
  #store = inject(RaceStore);
  updateTeam(team: ITeam) {
    const teams: ITeam[] = this.#store.teams().map((t: ITeam) => (t.constructorId === team.constructorId ? team : t));
    const drivers = teams.flatMap(t => t.drivers);
    const race = this.#store.race();
    const payload = {
      ...race,
      drivers,
      teams,
    } as IRace;
    return this.#store.update(payload, true);
  }
}
