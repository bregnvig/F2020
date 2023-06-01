import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { TeamService } from '@f2020/api';
import { ITeam } from '@f2020/data';

@Pipe({
  name: 'team',
  pure: false,
})
export class TeamPipe implements PipeTransform {

  private previousId?: string;
  private team?: ITeam;
  private teams?: ITeam[];

  constructor(service: TeamService, changeDetectorRef: ChangeDetectorRef) {
    service.teams$.subscribe(teams => {
      this.teams = teams;
      changeDetectorRef.markForCheck();
    });
  }

  transform(constructorId: string): ITeam | undefined {

    if (constructorId && constructorId !== this.previousId && this.teams?.length) {
      this.previousId = constructorId;
      this.team = this.teams.find(d => d.constructorId === constructorId);
    }
    return this.team;
  }

}
