import { sound } from '../engine/sound';

export function createSoundButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sound-button';

  const sync = (): void => {
    button.textContent = sound.isMuted ? '🔇' : '🔊';
    button.setAttribute(
      'aria-label',
      sound.isMuted ? 'Включить звук' : 'Выключить звук',
    );
    button.setAttribute('aria-pressed', String(!sound.isMuted));
  };

  sync();

  button.addEventListener('click', (event) => {
    event.preventDefault();
    sound.toggle();
    sync();
  });

  return button;
}
