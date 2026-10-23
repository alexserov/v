export type FoodKind =
  | 'carrot'
  | 'broccoli'
  | 'apple'
  | 'strawberry'
  | 'blueberry'
  | 'honey';

export const FOOD_KINDS: readonly FoodKind[] = [
  'carrot',
  'broccoli',
  'apple',
  'strawberry',
  'blueberry',
  'honey',
];

/** Draws a food icon centered at the current origin. */
export function drawFood(
  ctx: CanvasRenderingContext2D,
  kind: FoodKind,
  size: number,
): void {
  switch (kind) {
    case 'carrot':
      drawCarrot(ctx, size);
      break;
    case 'broccoli':
      drawBroccoli(ctx, size);
      break;
    case 'apple':
      drawApple(ctx, size);
      break;
    case 'strawberry':
      drawStrawberry(ctx, size);
      break;
    case 'blueberry':
      drawBlueberry(ctx, size);
      break;
    case 'honey':
      drawHoney(ctx, size);
      break;
  }
}

function drawCarrot(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.save();
  ctx.rotate(0.12);

  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.3);
  ctx.quadraticCurveTo(0, -s * 0.5, s * 0.55, -s * 0.3);
  ctx.lineTo(0, s * 0.95);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, -s * 0.02);
  ctx.lineTo(s * 0.12, s * 0.08);
  ctx.moveTo(-s * 0.15, s * 0.32);
  ctx.lineTo(s * 0.2, s * 0.4);
  ctx.stroke();

  ctx.fillStyle = '#5cbb66';
  ctx.beginPath();
  ctx.ellipse(-s * 0.32, -s * 0.56, s * 0.18, s * 0.34, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.32, -s * 0.56, s * 0.18, s * 0.34, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.68, s * 0.16, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBroccoli(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#c8e7a4';
  ctx.beginPath();
  ctx.roundRect(-s * 0.18, s * 0.05, s * 0.36, s * 0.85, s * 0.15);
  ctx.fill();

  const florets: ReadonlyArray<readonly [number, number, number]> = [
    [-s * 0.36, -s * 0.15, s * 0.4],
    [s * 0.36, -s * 0.15, s * 0.4],
    [0, -s * 0.5, s * 0.46],
    [0, -s * 0.15, s * 0.38],
  ];

  ctx.fillStyle = '#4fae52';
  for (const [fx, fy, fr] of florets) {
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  for (const [fx, fy, fr] of florets) {
    ctx.beginPath();
    ctx.arc(fx - fr * 0.25, fy - fr * 0.3, fr * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawApple(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#ef4f5f';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.08, s * 0.72, s * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7a4a2b';
  ctx.lineWidth = s * 0.13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.45);
  ctx.lineTo(s * 0.06, -s * 0.9);
  ctx.stroke();

  ctx.fillStyle = '#5cbb66';
  ctx.beginPath();
  ctx.ellipse(s * 0.3, -s * 0.78, s * 0.28, s * 0.15, -0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.26, -s * 0.05, s * 0.15, s * 0.22, 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawStrawberry(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#f0465e';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.95);
  ctx.bezierCurveTo(-s * 1.05, s * 0.15, -s * 0.75, -s * 0.7, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.75, -s * 0.7, s * 1.05, s * 0.15, 0, s * 0.95);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffe8a8';
  const seeds: ReadonlyArray<readonly [number, number]> = [
    [-0.35, 0.05],
    [0.35, 0.05],
    [0, 0.35],
    [-0.45, 0.45],
    [0.45, 0.45],
  ];
  for (const [sx, sy] of seeds) {
    ctx.beginPath();
    ctx.arc(sx * s, sy * s, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#5cbb66';
  for (const angle of [-0.8, -0.27, 0.27, 0.8]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.62, s * 0.16, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBlueberry(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#6c63c9';
  ctx.beginPath();
  ctx.arc(0, s * 0.08, s * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(-s * 0.22, -s * 0.12, s * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4b4694';
  ctx.beginPath();
  for (let index = 0; index < 10; index++) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? s * 0.3 : s * 0.14;
    const px = Math.cos(angle) * radius;
    const py = -s * 0.42 + Math.sin(angle) * radius * 0.7;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawHoney(ctx: CanvasRenderingContext2D, s: number): void {
  const jar = ctx.createLinearGradient(-s * 0.45, 0, s * 0.45, 0);
  jar.addColorStop(0, '#f8c75a');
  jar.addColorStop(1, '#e09a22');
  ctx.fillStyle = jar;
  ctx.beginPath();
  ctx.roundRect(-s * 0.45, -s * 0.3, s * 0.9, s * 0.95, s * 0.18);
  ctx.fill();

  ctx.fillStyle = '#c98f63';
  ctx.beginPath();
  ctx.roundRect(-s * 0.52, -s * 0.55, s * 1.04, s * 0.28, s * 0.1);
  ctx.fill();

  ctx.fillStyle = '#fff3dd';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.22, s * 0.26, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd36e';
  ctx.beginPath();
  ctx.moveTo(s * 0.32, -s * 0.12);
  ctx.quadraticCurveTo(s * 0.56, s * 0.08, s * 0.32, s * 0.24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.22, 0, s * 0.08, s * 0.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
}
