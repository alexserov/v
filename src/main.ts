import './style.css';
import { renderHome } from './home';
import { findGame, games } from './games/registry';
import { createBackButton } from './ui/backButton';

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('Не найден корневой элемент #app');
}
const root: HTMLElement = rootElement;

let destroyActiveGame: (() => void) | null = null;

function disposeActiveGame(): void {
  destroyActiveGame?.();
  destroyActiveGame = null;
}

function renderGameScreen(gameId: string): boolean {
  const game = findGame(gameId);
  if (!game) {
    return false;
  }

  root.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'game-screen';

  const host = document.createElement('div');
  host.className = 'game-host';

  const back = createBackButton(() => {
    location.hash = '/';
  });

  screen.append(host, back);
  root.append(screen);

  const instance = game.create();
  instance.mount(host);
  destroyActiveGame = () => instance.destroy();

  return true;
}

function route(): void {
  disposeActiveGame();

  const path = location.hash.replace(/^#/, '') || '/';
  const match = /^\/game\/([\w-]+)$/.exec(path);

  if (match && renderGameScreen(match[1])) {
    return;
  }

  renderHome(root, games);
}

window.addEventListener('hashchange', route);
route();
