export function createBackButton(onBack: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-button';
  button.setAttribute('aria-label', 'Назад');

  const arrow = document.createElement('span');
  arrow.className = 'back-button__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '←';

  button.append(arrow);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    onBack();
  });

  return button;
}
