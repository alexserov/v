export interface Hud {
  setValue(value: number | string): void;
  setIcon(icon: string): void;
  destroy(): void;
}

/**
 * Shared pill-shaped counter anchored at the top center of the game screen.
 * `pointer-events: none`, so it never blocks taps.
 */
export function createHud(
  host: HTMLElement,
  options: { icon: string; initial?: number },
): Hud {
  const overlay = document.createElement('div');
  overlay.className = 'game-hud';

  const pill = document.createElement('div');
  pill.className = 'hud-pill';

  const icon = document.createElement('span');
  icon.className = 'hud-pill__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = options.icon;

  const value = document.createElement('span');
  value.className = 'hud-pill__value';
  value.textContent = String(options.initial ?? 0);
  value.setAttribute('aria-live', 'polite');

  pill.append(icon, value);
  overlay.append(pill);
  host.append(overlay);

  return {
    setValue(next: number | string): void {
      value.textContent = String(next);
      value.classList.remove('is-pop');
      void value.offsetWidth;
      value.classList.add('is-pop');
    },
    setIcon(next: string): void {
      icon.textContent = next;
    },
    destroy(): void {
      overlay.remove();
    },
  };
}
