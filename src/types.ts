export interface GameInstance {
  /** Draws the game into the provided host element. */
  mount(host: HTMLElement): void;
  /** Stops timers, listeners and frees resources. */
  destroy(): void;
}

export interface GameDefinition {
  id: string;
  title: string;
  /** Emoji shown on the home tile. */
  icon: string;
  /** Gradient colors for the home tile. */
  colors: readonly [string, string];
  create(): GameInstance;
}
