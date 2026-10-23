import type { GameDefinition } from '../types';
import { bubblesGame } from './bubbles';
import { musicGame } from './music';
import { peekabooGame } from './peekaboo';
import { runnerGame } from './runner';

export const games: readonly GameDefinition[] = [
  runnerGame,
  bubblesGame,
  peekabooGame,
  musicGame,
];

export function findGame(id: string): GameDefinition | undefined {
  return games.find((game) => game.id === id);
}
