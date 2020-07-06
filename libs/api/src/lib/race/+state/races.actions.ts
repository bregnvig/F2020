import { Bid, IRace, RoundResult } from '@f2020/data';
import { createAction, props } from '@ngrx/store';

export const RacesActions = {

  loadRaces: createAction('[Races] Load Races'),

  loadRacesSuccess: createAction(
    '[Races] Load Races Success',
    props<{ races: IRace[] }>(),
  ),

  loadRacesFailure: createAction(
    '[Races] Load Races Failure',
    props<{ error: any }>(),
  ),

  selectRace: createAction(
    '[Races] Select race',
    props<{ round: string }>(),
  ),

  loadYourBid: createAction(
    '[Enter bid page] Load your bid',
  ),

  loadYourBidSuccess: createAction(
    '[Bid API] Load your bid Success',
    props<{ bid: Partial<Bid> }>(),
  ),

  loadYourBidFailure: createAction(
    '[Bid API] Load your bid Failure',
    props<{ error: any }>(),
  ),

  updateYourBid: createAction(
    '[Enter bid page] Update the your bid',
    props<{ bid: Bid }>()
  ),

  updateYourBidSuccess: createAction(
    '[Enter bid page] Update the your success',
  ),

  updateYourBidFailure: createAction(
    '[Bid API] Update your bid Failure',
    props<{ error: any }>(),
  ),

  loadBids: createAction(
    '[Race page] Load bids',
  ),

  loadBidsSuccess: createAction(
    '[Bid API] Load bids Success',
    props<{ bids: Bid[] }>(),
  ),

  loadBidsFailure: createAction(
    '[Bid API] Load bids Failure',
    props<{ error: any }>(),
  ),

  loadBid: createAction(
    '[Bid page] Load bid',
    props<{ uid: string }>()
  ),

  loadBidSuccess: createAction(
    '[Bid API] Load bid Success',
    props<{ bid: Bid }>(),
  ),

  loadBidFailure: createAction(
    '[Bid API] Load bid Failure',
    props<{ error: any }>(),
  ),

  loadResult: createAction(
    '[Result page] Load result',
  ),

  loadResultSuccess: createAction(
    '[Result API] Load result Success',
    props<{ result: Bid }>(),
  ),

  loadResultFailure: createAction(
    '[Result API] Load result Failure',
    props<{ error: any }>(),
  ),

  submitBid: createAction(
    '[Bid page] submit bid',
    props<{bid: Bid}>(),
  ),

  submitBidSuccess: createAction(
    '[Bid API] Submit bid Success',
  ),

  submitBidFailure: createAction(
    '[Bid API] Submit bid Failure',
    props<{ error: any }>(),
  ),

  submitResult: createAction(
    '[Result page] submit result',
  ),

  submitResultSuccess: createAction(
    '[Result API] Submit result Success',
  ),

  submitResultFailure: createAction(
    '[Result API] Submit result Failure',
    props<{ error: any }>(),
  ),

  updateRaceDrivers: createAction(
    '[Edit race drivers page] Update race drivers',
    props<{drivers: string[]}>()
  ),

  updateRaceDriversSuccess: createAction(
    '[Edit race drivers API] Update race drivers Success',
  ),

  updateRaceDriversFailure: createAction(
    '[Edit race drivers API] Update race drivers Failure',
    props<{ error: any }>(),
  ),

  loadLastYear: createAction(
    '[Landing Page] Load last year',
  ),

  loadLastYearSuccess: createAction(
    '[Result API] Load last year Success',
    props<{ result: RoundResult; }>(),
  ),

  loadLastYearFailure: createAction(
    '[Result API] Load last year Failure',
    props<{ error: any; }>(),
  ),
};
