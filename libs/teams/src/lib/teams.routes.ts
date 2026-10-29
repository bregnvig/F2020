import { Routes } from '@angular/router';
import { SeasonTeams } from './component/season-teams/season-teams';
import { TeamsGraph } from './component/teams-graph/teams-graph';

export const TeamsRoutes: Routes = [
  {
    path: '',
    component: SeasonTeams,
  },
  {
    path: 'graph',
    component: TeamsGraph,
  },
];
