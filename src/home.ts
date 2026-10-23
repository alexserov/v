import type { GameDefinition } from './types';

export function renderHome(
  root: HTMLElement,
  games: readonly GameDefinition[],
): void {
  root.replaceChildren();

  const scene = document.createElement('div');
  scene.className = 'home__scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `
    <div class="home__sun"></div>
    <div class="home__cloud home__cloud--one"></div>
    <div class="home__cloud home__cloud--two"></div>
    <div class="home__cloud home__cloud--three"></div>
    <div class="home__hill home__hill--back"></div>
    <div class="home__hill home__hill--front"></div>
    <span class="home__spark home__spark--one">✦</span>
    <span class="home__spark home__spark--two">✦</span>
    <span class="home__spark home__spark--three">✦</span>
  `;

  const home = document.createElement('main');
  home.className = 'home';

  const header = document.createElement('header');
  header.className = 'home__header';

  const logo = document.createElement('div');
  logo.className = 'home__logo';

  const logoImage = document.createElement('img');
  logoImage.src = './icons/icon-192.png';
  logoImage.alt = '';
  logoImage.width = 76;
  logoImage.height = 76;

  const twinkleOne = document.createElement('span');
  twinkleOne.className = 'home__twinkle home__twinkle--one';
  twinkleOne.setAttribute('aria-hidden', 'true');
  twinkleOne.textContent = '✦';

  const twinkleTwo = document.createElement('span');
  twinkleTwo.className = 'home__twinkle home__twinkle--two';
  twinkleTwo.setAttribute('aria-hidden', 'true');
  twinkleTwo.textContent = '✦';

  logo.append(logoImage, twinkleOne, twinkleTwo);

  const title = document.createElement('h1');
  title.className = 'home__title';
  title.textContent = 'Мини-игры';

  const subtitle = document.createElement('p');
  subtitle.className = 'home__subtitle';
  subtitle.textContent = 'Выбери игру';

  header.append(logo, title, subtitle);

  const grid = document.createElement('div');
  grid.className = 'tiles';

  for (const [index, game] of games.entries()) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.style.setProperty('--tile-from', game.colors[0]);
    tile.style.setProperty('--tile-to', game.colors[1]);
    tile.style.animationDelay = `${index * 55}ms`;
    tile.setAttribute('aria-label', game.title);

    const plate = document.createElement('span');
    plate.className = 'tile__plate';

    const icon = document.createElement('span');
    icon.className = 'tile__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = game.icon;

    plate.append(icon);

    const label = document.createElement('span');
    label.className = 'tile__title';
    label.textContent = game.title;

    tile.append(plate, label);
    tile.addEventListener('click', () => {
      location.hash = `/game/${game.id}`;
    });

    grid.append(tile);
  }

  home.append(header, grid);
  root.append(scene, home);
}
