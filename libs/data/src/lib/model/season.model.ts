import { WBC } from './wbc.model';

export interface ISeason {
  readonly id?: string;
  current: boolean;
  name: string;
  wbc: WBC;
}
