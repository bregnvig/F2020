import { routerReducer } from '@ngrx/router-store';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';

export interface State {
  // router: RouterReducerState
}

export const reducers: ActionReducerMap<State> = {
  router: routerReducer
};

// export const selectRouter = (state: State) => state.router;


// export const {
//   selectQueryParams,    // select the current route query params
//   selectRouteParams,    // select the current route params
//   selectRouteData,      // select the current route data
//   selectUrl,            // select the current url
// } = getSelectors(selectRouter);


export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];
