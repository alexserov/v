import type { GameDefinition } from '../types';
import { bubblesGame } from './bubbles';
import { coloringGame } from './coloring';
import { dressupGame } from './dressup';
import { driveGame } from './drive';
import { feedGame } from './feed';
import { musicGame } from './music';
import { peekabooGame } from './peekaboo';
import { runnerGame } from './runner';

export const games: readonly GameDefinition[] = [
  runnerGame,
  bubblesGame,
  peekabooGame,
  musicGame,
  feedGame,
  driveGame,
  dressupGame,
  coloringGame,
];

export function findGame(id: string): GameDefinition | undefined {
  return games.find((game) => game.id === id);
}
