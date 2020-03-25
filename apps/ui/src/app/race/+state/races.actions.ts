import { Bid } from './../model/bid.model';
import { createAction, props } from '@ngrx/store';
import { IRace } from '@f2020/data';

const loadRaces = createAction('[Races] Load Races');

const loadRacesSuccess = createAction(
  '[Races] Load Races Success',
  props<{ races: IRace[] }>(),
);

const loadRacesFailure = createAction(
  '[Races] Load Races Failure',
  props<{ error: any }>(),
);

const selectRace = createAction(
  '[Races] Race page',
  props<{ country: string }>(),
);

const loadBid = createAction(
  '[Bid page] Load current bid',
);

const loadBidSuccess = createAction(
  '[Bid page] Load current bid Success',
  props<{ bid: Partial<Bid> }>(),
);

const loadBidFailure = createAction(
  '[Bid page] Load current bid Failure',
  props<{ error: any }>(),
);

const loadBids = createAction(
  '[Race page] Load bids',
);

const loadBidsSuccess = createAction(
  '[Bid API] Load bids Success',
  props<{ bids: Bid[] }>(),
);

const loadBidsFailure = createAction(
  '[Bid API] Load bids Failure',
  props<{ error: any }>(),
);

const updateBid = createAction(
  '[Bid page] Update the current bid',
  props<{bid: Bid}>()
);

const updateBidFailure = createAction(
  '[Bid page] Update current bid Failure',
  props<{ error: any }>(),
);

export const RacesActions = {
  loadRaces,
  loadRacesSuccess,
  loadRacesFailure,
  selectRace,
  loadBid,
  loadBidSuccess,
  loadBidFailure,
  loadBids,
  loadBidsSuccess,
  loadBidsFailure,
  updateBid,
  updateBidFailure,
};

