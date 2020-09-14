import { WBC, Player } from '@f2020/data';

type UidPoints = [string, number];
export interface WBCGraphEntry {
  player: Player;
  points: number;
  entries: WBCGraphPlayerEntry[];
}

export interface WBCGraphPlayerEntry {
  value: number;
  name: string;
}

export class WBCGraph {

  entries: WBCGraphEntry[];


  constructor(wbc: WBC) {
    const results = (wbc.results || []);
    const playerMap = results.reduce((acc, result) => {
      result.players.forEach(p => acc.set(p.player.uid, p.player));
      return acc;
    }, new Map<string, Player>());
    const uids: string[] = Array.from(playerMap.keys());

    const summedPoints = new Map<string, number>();
    const playerToPosition: Map<string, WBCGraphPlayerEntry[]> = uids.reduce((acc, uid) => acc.set(uid, []), new Map<string, WBCGraphPlayerEntry[]>());

    results.forEach(result => {

      uids.map(uid => {
        summedPoints.set(uid, (summedPoints.get(uid) || 0) + (result.players.find(p => p.player.uid === uid)?.points ?? 0));
        return [uid, summedPoints.get(uid)!] as UidPoints;
      })
        .sort((a, b) => a[1] - b[1])
        .forEach((entry, index) => playerToPosition.get(entry[0]).push({
          name: result.raceName,
          value: index + 1,
        }));
    });
    this.entries = Array.from(playerToPosition.entries()).map(([uid, entries]) => ({
      player: playerMap.get(uid),
      points: summedPoints.get(uid),
      entries
    }));
  }
}

/*
[
  {
    "name": "Flemming",
    "series": [
      {
        "value": 14,
        "name": "Austria"
      },
      {
        "value": 13,
        "name": "Steirmark"
      },
    ]
  },
  {
    "name": "Michael",
    "series": [
      {
        "value": 13,
        "name": "Austria"
      },
      {
        "value": 14,
        "name": "Steirmark"
      }
    ]
  }
]
*/