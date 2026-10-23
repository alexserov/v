import type { GameDefinition } from './types';

export function renderHome(root: HTMLElement, games: readonly GameDefinition[]): void {
  root.replaceChildren();

  const home = document.createElement('main');
  home.className = 'home';

  const header = document.createElement('header');
  header.className = 'home__header';

  const title = document.createElement('h1');
  title.className = 'home__title';
  title.textContent = 'Мини-игры';

  const subtitle = document.createElement('p');
  subtitle.className = 'home__subtitle';
  subtitle.textContent = 'Выбери игру';

  header.append(title, subtitle);

  const grid = document.createElement('div');
  grid.className = 'tiles';

  for (const game of games) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.style.setProperty('--tile-from', game.colors[0]);
    tile.style.setProperty('--tile-to', game.colors[1]);
    tile.setAttribute('aria-label', game.title);

    const icon = document.createElement('span');
    icon.className = 'tile__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = game.icon;

    const label = document.createElement('span');
    label.className = 'tile__title';
    label.textContent = game.title;

    tile.append(icon, label);
    tile.addEventListener('click', () => {
      location.hash = `/game/${game.id}`;
    });

    grid.append(tile);
  }

  home.append(header, grid);
  root.append(home);
}
