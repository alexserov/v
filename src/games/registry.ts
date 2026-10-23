import type { GameDefinition } from '../types';
import { runnerGame } from './runner';

export const games: readonly GameDefinition[] = [runnerGame];

export function findGame(id: string): GameDefinition | undefined {
  return games.find((game) => game.id === id);
}
