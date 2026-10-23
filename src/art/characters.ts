export type AnimalKind =
  | 'bunny'
  | 'bear'
  | 'fox'
  | 'hedgehog'
  | 'kitten'
  | 'bird'
  | 'panda'
  | 'mouse'
  | 'frog'
  | 'owl'
  | 'penguin'
  | 'sheep'
  | 'koala'
  | 'tiger';

export type AnimalExpression = 'happy' | 'sleepy' | 'surprised' | 'wink';

export interface AnimalHeadOptions {
  expression?: AnimalExpression;
  blush?: boolean;
}

export const ANIMAL_KINDS: readonly AnimalKind[] = [
  'bunny',
  'bear',
  'fox',
  'hedgehog',
  'kitten',
  'bird',
  'panda',
  'mouse',
  'frog',
  'owl',
  'penguin',
  'sheep',
  'koala',
  'tiger',
];

const DARK = '#4a2b5e';

/**
 * Draws a cute animal head centered at the current origin.
 * Ears may extend above the given radius.
 */
export function drawAnimalHead(
  ctx: CanvasRenderingContext2D,
  kind: AnimalKind,
  radius: number,
  options: AnimalHeadOptions = {},
): void {
  const expression = options.expression ?? 'happy';
  const blush = options.blush ?? true;

  switch (kind) {
    case 'bunny':
      drawBunny(ctx, radius, expression, blush);
      break;
    case 'bear':
      drawBear(ctx, radius, expression, blush);
      break;
    case 'fox':
      drawFox(ctx, radius, expression, blush);
      break;
    case 'hedgehog':
      drawHedgehog(ctx, radius, expression, blush);
      break;
    case 'kitten':
      drawKitten(ctx, radius, expression, blush);
      break;
    case 'bird':
      drawBird(ctx, radius, expression, blush);
      break;
    case 'panda':
      drawPanda(ctx, radius, expression, blush);
      break;
    case 'mouse':
      drawMouse(ctx, radius, expression, blush);
      break;
    case 'frog':
      drawFrog(ctx, radius, expression, blush);
      break;
    case 'owl':
      drawOwl(ctx, radius, expression, blush);
      break;
    case 'penguin':
      drawPenguin(ctx, radius, expression, blush);
      break;
    case 'sheep':
      drawSheep(ctx, radius, expression, blush);
      break;
    case 'koala':
      drawKoala(ctx, radius, expression, blush);
      break;
    case 'tiger':
      drawTiger(ctx, radius, expression, blush);
      break;
  }
}

const BODY_COLORS: Record<AnimalKind, string> = {
  bunny: '#fffdfd',
  bear: '#c98f63',
  fox: '#f59a4a',
  hedgehog: '#f2d2b0',
  kitten: '#efe6fb',
  bird: '#ffd36e',
  panda: '#fffdfd',
  mouse: '#cfc8dd',
  frog: '#8fdc8a',
  owl: '#c9a26b',
  penguin: '#3d4a6b',
  sheep: '#fffdfd',
  koala: '#b9b3c9',
  tiger: '#f5a24a',
};

export function animalBodyColor(kind: AnimalKind): string {
  return BODY_COLORS[kind];
}

/** Draws a seated animal with the head centered at the current origin. */
export function drawSittingAnimal(
  ctx: CanvasRenderingContext2D,
  kind: AnimalKind,
  size: number,
  options: AnimalHeadOptions = {},
): void {
  const body = BODY_COLORS[kind];

  ctx.fillStyle = 'rgba(60, 90, 60, 0.14)';
  ctx.beginPath();
  ctx.ellipse(0, size * 1.75, size * 0.9, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.95, size * 0.8, size * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-size * 0.35, size * 1.12, size * 0.22, size * 0.13, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(-size * 0.4, size * 1.55, size * 0.26, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.4, size * 1.55, size * 0.26, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  drawAnimalHead(ctx, kind, size, options);
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation = 0,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
): void {
  const eyeY = -r * 0.08;
  const offset = r * 0.3;

  const openEye = (x: number): void => {
    const eyeR = expression === 'surprised' ? r * 0.14 : r * 0.1;
    ctx.fillStyle = DARK;
    circle(ctx, x, eyeY, eyeR);
    ctx.fillStyle = '#ffffff';
    circle(ctx, x - eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.35);
  };

  const closedEye = (x: number): void => {
    ctx.strokeStyle = DARK;
    ctx.lineWidth = Math.max(1.2, r * 0.075);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, eyeY, r * 0.13, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  };

  if (expression === 'sleepy') {
    closedEye(-offset);
    closedEye(offset);
    return;
  }

  if (expression === 'wink') {
    openEye(-offset);
    closedEye(offset);
    return;
  }

  openEye(-offset);
  openEye(offset);
}

function drawBlush(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = 'rgba(255, 140, 185, 0.5)';
  circle(ctx, -r * 0.52, r * 0.2, r * 0.16);
  circle(ctx, r * 0.52, r * 0.2, r * 0.16);
}

function drawSmile(
  ctx: CanvasRenderingContext2D,
  r: number,
  yFactor = 0.34,
): void {
  ctx.strokeStyle = DARK;
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, r * yFactor, r * 0.16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

function drawBunny(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#fffdfd';
  ellipse(ctx, -r * 0.36, -r * 1.02, r * 0.23, r * 0.6, -0.12);
  ellipse(ctx, r * 0.36, -r * 1.02, r * 0.23, r * 0.6, 0.12);

  ctx.fillStyle = '#ffc7e0';
  ellipse(ctx, -r * 0.36, -r * 1.02, r * 0.1, r * 0.38, -0.12);
  ellipse(ctx, r * 0.36, -r * 1.02, r * 0.1, r * 0.38, 0.12);

  ctx.fillStyle = '#fffdfd';
  circle(ctx, 0, 0, r);
  ctx.fillStyle = 'rgba(255, 220, 240, 0.35)';
  ellipse(ctx, 0, r * 0.55, r * 0.7, r * 0.35);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = '#ff8fbf';
  ellipse(ctx, 0, r * 0.18, r * 0.1, r * 0.08);
  drawSmile(ctx, r, 0.34);
}

function drawBear(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#b9815a';
  circle(ctx, -r * 0.68, -r * 0.62, r * 0.32);
  circle(ctx, r * 0.68, -r * 0.62, r * 0.32);

  ctx.fillStyle = '#e4b58c';
  circle(ctx, -r * 0.68, -r * 0.62, r * 0.16);
  circle(ctx, r * 0.68, -r * 0.62, r * 0.16);

  ctx.fillStyle = '#c98f63';
  circle(ctx, 0, 0, r);

  ctx.fillStyle = '#f2d7bd';
  ellipse(ctx, 0, r * 0.3, r * 0.46, r * 0.35);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = DARK;
  ellipse(ctx, 0, r * 0.16, r * 0.13, r * 0.1);
  drawSmile(ctx, r, 0.38);
}

function drawFox(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#f08a3c';
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.35);
  ctx.lineTo(-r * 0.62, -r * 1.2);
  ctx.lineTo(-r * 0.12, -r * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.85, -r * 0.35);
  ctx.lineTo(r * 0.62, -r * 1.2);
  ctx.lineTo(r * 0.12, -r * 0.78);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffc7b0';
  ctx.beginPath();
  ctx.moveTo(-r * 0.72, -r * 0.48);
  ctx.lineTo(-r * 0.61, -r * 0.98);
  ctx.lineTo(-r * 0.32, -r * 0.74);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.72, -r * 0.48);
  ctx.lineTo(r * 0.61, -r * 0.98);
  ctx.lineTo(r * 0.32, -r * 0.74);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f59a4a';
  circle(ctx, 0, 0, r);

  ctx.fillStyle = '#fff3e6';
  ellipse(ctx, 0, r * 0.3, r * 0.48, r * 0.36);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = DARK;
  ellipse(ctx, 0, r * 0.22, r * 0.12, r * 0.09);
  drawSmile(ctx, r, 0.42);
}

function drawHedgehog(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#8a5a3b';
  const spikes = 11;
  for (let index = 0; index < spikes; index++) {
    const angle = Math.PI + (index / (spikes - 1)) * Math.PI;
    const baseX = Math.cos(angle) * r * 0.88;
    const baseY = Math.sin(angle) * r * 0.88;
    const tipX = Math.cos(angle) * r * 1.32;
    const tipY = Math.sin(angle) * r * 1.32;
    const perp = angle + Math.PI / 2;
    const width = r * 0.16;

    ctx.beginPath();
    ctx.moveTo(baseX + Math.cos(perp) * width, baseY + Math.sin(perp) * width);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseX - Math.cos(perp) * width, baseY - Math.sin(perp) * width);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#f2d2b0';
  circle(ctx, 0, 0, r * 0.95);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = '#fbe3c8';
  ellipse(ctx, 0, r * 0.32, r * 0.34, r * 0.26);

  ctx.fillStyle = DARK;
  ellipse(ctx, 0, r * 0.4, r * 0.11, r * 0.08);
  drawSmile(ctx, r, 0.46);
}

function drawKitten(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#d9c8f0';
  ctx.beginPath();
  ctx.moveTo(-r * 0.72, -r * 0.45);
  ctx.lineTo(-r * 0.72, -r * 1.05);
  ctx.lineTo(-r * 0.15, -r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.72, -r * 0.45);
  ctx.lineTo(r * 0.72, -r * 1.05);
  ctx.lineTo(r * 0.15, -r * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffc7e0';
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, -r * 0.55);
  ctx.lineTo(-r * 0.62, -r * 0.92);
  ctx.lineTo(-r * 0.28, -r * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.62, -r * 0.55);
  ctx.lineTo(r * 0.62, -r * 0.92);
  ctx.lineTo(r * 0.28, -r * 0.68);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#efe6fb';
  circle(ctx, 0, 0, r);
  ctx.fillStyle = 'rgba(220, 205, 245, 0.4)';
  ellipse(ctx, 0, r * 0.55, r * 0.68, r * 0.34);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = '#ff8fbf';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.2);
  ctx.lineTo(-r * 0.08, r * 0.12);
  ctx.lineTo(r * 0.08, r * 0.12);
  ctx.closePath();
  ctx.fill();
  drawSmile(ctx, r, 0.34);

  ctx.strokeStyle = 'rgba(74, 43, 94, 0.45)';
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (const step of [0, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.32, r * 0.26 + step * r * 0.09);
      ctx.lineTo(side * r * 0.74, r * 0.22 + step * r * 0.15);
      ctx.stroke();
    }
  }
}

function drawPanda(
  ctx: CanvasRenderingContext2D,
  r: number,
  _expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#3b3b4a';
  circle(ctx, -r * 0.66, -r * 0.62, r * 0.3);
  circle(ctx, r * 0.66, -r * 0.62, r * 0.3);

  ctx.fillStyle = '#fffdfd';
  circle(ctx, 0, 0, r);

  if (blush) {
    ctx.fillStyle = 'rgba(255, 140, 185, 0.45)';
    circle(ctx, -r * 0.62, r * 0.3, r * 0.13);
    circle(ctx, r * 0.62, r * 0.3, r * 0.13);
  }

  ctx.fillStyle = '#3b3b4a';
  ellipse(ctx, -r * 0.34, -r * 0.04, r * 0.2, r * 0.24, 0.3);
  ellipse(ctx, r * 0.34, -r * 0.04, r * 0.2, r * 0.24, -0.3);

  ctx.fillStyle = '#fffdfd';
  circle(ctx, -r * 0.34, -r * 0.04, r * 0.08);
  circle(ctx, r * 0.34, -r * 0.04, r * 0.08);
  ctx.fillStyle = DARK;
  circle(ctx, -r * 0.34, -r * 0.04, r * 0.045);
  circle(ctx, r * 0.34, -r * 0.04, r * 0.045);

  ctx.fillStyle = '#3b3b4a';
  ellipse(ctx, 0, r * 0.2, r * 0.11, r * 0.08);
  drawSmile(ctx, r, 0.34);
}

function drawMouse(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#c9c2d8';
  circle(ctx, -r * 0.62, -r * 0.5, r * 0.36);
  circle(ctx, r * 0.62, -r * 0.5, r * 0.36);
  ctx.fillStyle = '#ffc7e0';
  circle(ctx, -r * 0.62, -r * 0.5, r * 0.2);
  circle(ctx, r * 0.62, -r * 0.5, r * 0.2);

  ctx.fillStyle = '#cfc8dd';
  circle(ctx, 0, 0, r);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = '#ff8fbf';
  circle(ctx, 0, r * 0.18, r * 0.1);
  drawSmile(ctx, r, 0.34);

  ctx.strokeStyle = 'rgba(74, 43, 94, 0.45)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (const step of [0, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.3, r * 0.22 + step * r * 0.08);
      ctx.lineTo(side * r * 0.78, r * 0.18 + step * r * 0.14);
      ctx.stroke();
    }
  }
}

function drawFrog(
  ctx: CanvasRenderingContext2D,
  r: number,
  _expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#8fdc8a';
  circle(ctx, -r * 0.42, -r * 0.72, r * 0.3);
  circle(ctx, r * 0.42, -r * 0.72, r * 0.3);

  ctx.fillStyle = '#8fdc8a';
  circle(ctx, 0, 0, r);

  ctx.fillStyle = '#fffdfd';
  circle(ctx, -r * 0.42, -r * 0.72, r * 0.17);
  circle(ctx, r * 0.42, -r * 0.72, r * 0.17);
  ctx.fillStyle = DARK;
  circle(ctx, -r * 0.42, -r * 0.72, r * 0.085);
  circle(ctx, r * 0.42, -r * 0.72, r * 0.085);
  ctx.fillStyle = '#ffffff';
  circle(ctx, -r * 0.45, -r * 0.75, r * 0.03);
  circle(ctx, r * 0.39, -r * 0.75, r * 0.03);

  if (blush) {
    drawBlush(ctx, r);
  }

  ctx.strokeStyle = DARK;
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, r * 0.12, r * 0.42, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();

  ctx.fillStyle = DARK;
  circle(ctx, -r * 0.12, -r * 0.02, r * 0.03);
  circle(ctx, r * 0.12, -r * 0.02, r * 0.03);
}

function drawOwl(
  ctx: CanvasRenderingContext2D,
  r: number,
  _expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#b98a55';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.7);
  ctx.lineTo(-r * 0.72, -r * 1.15);
  ctx.lineTo(-r * 0.2, -r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.7);
  ctx.lineTo(r * 0.72, -r * 1.15);
  ctx.lineTo(r * 0.2, -r * 0.85);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c9a26b';
  circle(ctx, 0, 0, r);

  ctx.fillStyle = '#fff6e6';
  circle(ctx, -r * 0.34, -r * 0.05, r * 0.3);
  circle(ctx, r * 0.34, -r * 0.05, r * 0.3);
  ctx.fillStyle = '#ffd36e';
  circle(ctx, -r * 0.34, -r * 0.05, r * 0.2);
  circle(ctx, r * 0.34, -r * 0.05, r * 0.2);
  ctx.fillStyle = DARK;
  circle(ctx, -r * 0.34, -r * 0.05, r * 0.1);
  circle(ctx, r * 0.34, -r * 0.05, r * 0.1);
  ctx.fillStyle = '#ffffff';
  circle(ctx, -r * 0.37, -r * 0.08, r * 0.035);
  circle(ctx, r * 0.31, -r * 0.08, r * 0.035);

  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.42);
  ctx.lineTo(-r * 0.13, r * 0.16);
  ctx.lineTo(r * 0.13, r * 0.16);
  ctx.closePath();
  ctx.fill();

  if (blush) {
    ctx.fillStyle = 'rgba(255, 140, 185, 0.45)';
    circle(ctx, -r * 0.6, r * 0.3, r * 0.12);
    circle(ctx, r * 0.6, r * 0.3, r * 0.12);
  }
}

function drawPenguin(
  ctx: CanvasRenderingContext2D,
  r: number,
  _expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#3d4a6b';
  circle(ctx, 0, 0, r);

  ctx.fillStyle = '#fffdfd';
  ellipse(ctx, 0, r * 0.22, r * 0.58, r * 0.48);

  ctx.fillStyle = DARK;
  circle(ctx, -r * 0.24, r * 0.02, r * 0.1);
  circle(ctx, r * 0.24, r * 0.02, r * 0.1);
  ctx.fillStyle = '#ffffff';
  circle(ctx, -r * 0.27, -r * 0.01, r * 0.035);
  circle(ctx, r * 0.21, -r * 0.01, r * 0.035);

  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.36);
  ctx.lineTo(-r * 0.13, r * 0.17);
  ctx.lineTo(r * 0.13, r * 0.17);
  ctx.closePath();
  ctx.fill();

  if (blush) {
    ctx.fillStyle = 'rgba(255, 140, 185, 0.45)';
    circle(ctx, -r * 0.5, r * 0.32, r * 0.11);
    circle(ctx, r * 0.5, r * 0.32, r * 0.11);
  }
}

function drawSheep(
  ctx: CanvasRenderingContext2D,
  r: number,
  _expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#fffdfd';
  for (let index = 0; index < 9; index++) {
    const angle = (index / 9) * Math.PI * 2;
    circle(
      ctx,
      Math.cos(angle) * r * 0.78,
      Math.sin(angle) * r * 0.78,
      r * 0.34,
    );
  }
  circle(ctx, 0, 0, r * 0.8);

  ctx.fillStyle = '#f2d2b0';
  ellipse(ctx, -r * 0.72, r * 0.12, r * 0.2, r * 0.12, -0.35);
  ellipse(ctx, r * 0.72, r * 0.12, r * 0.2, r * 0.12, 0.35);

  ctx.fillStyle = '#f2d2b0';
  circle(ctx, 0, r * 0.16, r * 0.64);

  if (blush) {
    ctx.fillStyle = 'rgba(255, 140, 185, 0.45)';
    circle(ctx, -r * 0.42, r * 0.28, r * 0.12);
    circle(ctx, r * 0.42, r * 0.28, r * 0.12);
  }

  ctx.fillStyle = DARK;
  circle(ctx, -r * 0.26, r * 0.1, r * 0.08);
  circle(ctx, r * 0.26, r * 0.1, r * 0.08);
  ctx.fillStyle = '#ffffff';
  circle(ctx, -r * 0.28, r * 0.07, r * 0.03);
  circle(ctx, r * 0.24, r * 0.07, r * 0.03);

  ctx.fillStyle = '#ff8fbf';
  ellipse(ctx, 0, r * 0.32, r * 0.09, r * 0.07);

  ctx.strokeStyle = DARK;
  ctx.lineWidth = Math.max(1.2, r * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, r * 0.42, r * 0.12, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

function drawKoala(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#b9b3c9';
  circle(ctx, -r * 0.68, -r * 0.5, r * 0.36);
  circle(ctx, r * 0.68, -r * 0.5, r * 0.36);
  ctx.fillStyle = '#d9d4e4';
  circle(ctx, -r * 0.68, -r * 0.5, r * 0.22);
  circle(ctx, r * 0.68, -r * 0.5, r * 0.22);

  ctx.fillStyle = '#b9b3c9';
  circle(ctx, 0, 0, r);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = '#5a5468';
  ellipse(ctx, 0, r * 0.16, r * 0.18, r * 0.24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ellipse(ctx, -r * 0.05, r * 0.08, r * 0.06, r * 0.1);
  drawSmile(ctx, r, 0.48);
}

function drawTiger(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#f5a24a';
  circle(ctx, -r * 0.62, -r * 0.6, r * 0.28);
  circle(ctx, r * 0.62, -r * 0.6, r * 0.28);
  ctx.fillStyle = '#ffc7b0';
  circle(ctx, -r * 0.62, -r * 0.6, r * 0.14);
  circle(ctx, r * 0.62, -r * 0.6, r * 0.14);

  ctx.fillStyle = '#f5a24a';
  circle(ctx, 0, 0, r);

  ctx.strokeStyle = '#c96a2a';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = 'round';
  const stripes: ReadonlyArray<readonly [number, number, number, number]> = [
    [-0.55, -0.55, -0.35, -0.3],
    [-0.68, -0.2, -0.46, -0.1],
    [0.55, -0.55, 0.35, -0.3],
    [0.68, -0.2, 0.46, -0.1],
    [0, -0.88, 0, -0.62],
  ];
  for (const [x1, y1, x2, y2] of stripes) {
    ctx.beginPath();
    ctx.moveTo(x1 * r, y1 * r);
    ctx.lineTo(x2 * r, y2 * r);
    ctx.stroke();
  }

  ctx.fillStyle = '#fff3e6';
  ellipse(ctx, 0, r * 0.3, r * 0.46, r * 0.34);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = DARK;
  ellipse(ctx, 0, r * 0.2, r * 0.12, r * 0.09);
  drawSmile(ctx, r, 0.42);
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  r: number,
  expression: AnimalExpression,
  blush: boolean,
): void {
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.92);
  ctx.lineTo(0, -r * 1.25);
  ctx.lineTo(r * 0.14, -r * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffd36e';
  circle(ctx, 0, 0, r);
  ctx.fillStyle = 'rgba(255, 235, 150, 0.5)';
  ellipse(ctx, 0, r * 0.55, r * 0.66, r * 0.32);

  if (blush) {
    drawBlush(ctx, r);
  }
  drawEyes(ctx, r, expression);

  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.38);
  ctx.lineTo(-r * 0.14, r * 0.16);
  ctx.lineTo(r * 0.14, r * 0.16);
  ctx.closePath();
  ctx.fill();
}
