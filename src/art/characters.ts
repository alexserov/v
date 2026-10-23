export type AnimalKind =
  | 'bunny'
  | 'bear'
  | 'fox'
  | 'hedgehog'
  | 'kitten'
  | 'bird';

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
  }
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
