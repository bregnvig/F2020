import { Player, WBC } from '@f2020/data';

export interface WBCGraphEntry {
  player: Player;
  /** The WBC points after the last race */
  points: number;
  /** The place and the WBC points after each race. Players with the same points share the place */
  races: { round: number; name: string; results: [{ position: number; points: number }] }[];
}

/** The WBC standing of each player after each race */
export const wbcGraph = (wbc?: WBC): WBCGraphEntry[] => {
  const results = wbc?.results ?? [];
  const players = new Map(results.flatMap(result => result.players.map(({ player }) => [player.uid, player] as const)));
  const totals = new Map([...players.keys()].map(uid => [uid, 0]));
  const races = new Map<string, WBCGraphEntry['races']>([...players.keys()].map(uid => [uid, []]));
  results.forEach(({ round, raceName, players: racePlayers }) => {
    totals.forEach((total, uid) => totals.set(uid, total + (racePlayers.find(p => p.player.uid === uid)?.points ?? 0)));
    totals.forEach((points, uid) =>
      races.get(uid)!.push({ round, name: raceName, results: [{ position: [...totals.values()].filter(other => other > points).length + 1, points }] }),
    );
  });
  return [...players.values()].map(player => ({ player, points: totals.get(player.uid)!, races: races.get(player.uid)! }));
};
