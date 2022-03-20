import { converterFn as timestamp } from './timestamp-converter';
import { converter as transaction } from './transaction.converter';

export const converter = {
  transaction,
  timestamp
};
