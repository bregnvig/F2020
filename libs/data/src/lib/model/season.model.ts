import { WBC } from './wbc.model';

export interface ISeason {
  readonly id?: string;
  name: string;
  wbc: WBC;
}
