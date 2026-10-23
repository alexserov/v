import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import type { GameDefinition } from '../../types';

interface Region {
  path: Path2D;
  color: string | null;
}

interface Picture {
  name: string;
  regions: Region[];
  decorations: (ctx: CanvasRenderingContext2D) => void;
}

const PALETTE = [
  '#ff6f6f',
  '#ffa94d',
  '#ffe36e',
  '#8fdc8a',
  '#5ed0b0',
  '#7fc8ff',
  '#a78bfa',
  '#ff8fbf',
];

const DESIGN = 300;
const outline = '#4a2b5e';

function region(path: Path2D): Region {
  return { path, color: null };
}

function circlePath(x: number, y: number, r: number): Path2D {
  const path = new Path2D();
  path.arc(x, y, r, 0, Math.PI * 2);
  return path;
}

function ellipsePath(
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation = 0,
): Path2D {
  const path = new Path2D();
  path.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  return path;
}

function roundRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): Path2D {
  const path = new Path2D();
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  path.closePath();
  return path;
}

function polygonPath(
  points: ReadonlyArray<readonly [number, number]>,
): Path2D {
  const path = new Path2D();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  });
  path.closePath();
  return path;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.fillStyle = 'rgba(255, 140, 185, 0.5)';
  for (const sx of [-0.55, 0.55]) {
    ctx.beginPath();
    ctx.arc(cx + sx * r, cy + r * 0.22, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = outline;
  for (const sx of [-0.3, 0.3]) {
    ctx.beginPath();
    ctx.arc(cx + sx * r, cy - r * 0.05, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  for (const sx of [-0.3, 0.3]) {
    ctx.beginPath();
    ctx.arc(cx + sx * r - r * 0.03, cy - r * 0.09, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ff8fbf';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.2, r * 0.1, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.34, r * 0.16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

function makeBunny(): Picture {
  return {
    name: 'Зайчик',
    regions: [
      region(ellipsePath(110, 80, 22, 60, -0.15)),
      region(ellipsePath(190, 80, 22, 60, 0.15)),
      region(ellipsePath(150, 220, 62, 58)),
      region(circlePath(150, 140, 55)),
      region(ellipsePath(150, 228, 32, 38)),
      region(ellipsePath(115, 268, 24, 12)),
      region(ellipsePath(185, 268, 24, 12)),
    ],
    decorations: (ctx) => drawFace(ctx, 150, 140, 55),
  };
}

function makeFlower(): Picture {
  const regions: Region[] = [
    region(roundRectPath(144, 150, 12, 120, 6)),
    region(ellipsePath(118, 200, 28, 14, -0.5)),
    region(ellipsePath(182, 218, 28, 14, 0.5)),
  ];

  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    const px = 150 + Math.cos(angle) * 52;
    const py = 120 + Math.sin(angle) * 52;
    regions.push(region(ellipsePath(px, py, 30, 46, angle + Math.PI / 2)));
  }

  regions.push(region(circlePath(150, 120, 32)));

  return {
    name: 'Цветок',
    regions,
    decorations: (ctx) => drawFace(ctx, 150, 120, 26),
  };
}

function makeCar(): Picture {
  return {
    name: 'Машинка',
    regions: [
      region(roundRectPath(50, 150, 200, 72, 22)),
      region(roundRectPath(95, 105, 110, 62, 26)),
      region(roundRectPath(107, 117, 38, 34, 8)),
      region(roundRectPath(155, 117, 38, 34, 8)),
      region(circlePath(95, 222, 30)),
      region(circlePath(205, 222, 30)),
      region(circlePath(238, 176, 10)),
    ],
    decorations: (ctx) => {
      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(132, 182, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(168, 182, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(150, 190, 10, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(118, 130, 8, 12, -0.4, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

function makeFish(): Picture {
  return {
    name: 'Рыбка',
    regions: [
      region(polygonPath([[72, 150], [18, 102], [18, 198]])),
      region(polygonPath([[118, 108], [150, 58], [182, 108]])),
      region(ellipsePath(150, 150, 80, 55)),
      region(ellipsePath(118, 178, 30, 13, 0.5)),
    ],
    decorations: (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(190, 136, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(193, 136, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(191, 133, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(222, 156, 10, -0.15 * Math.PI, 0.5 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(120, 190, 240, 0.85)';
      ctx.lineWidth = 2.5;
      for (const [x, y, r] of [
        [248, 88, 11],
        [264, 64, 7],
        [240, 58, 5],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
  };
}

function makeHouse(): Picture {
  return {
    name: 'Домик',
    regions: [
      region(circlePath(250, 55, 28)),
      region(roundRectPath(198, 80, 22, 45, 4)),
      region(polygonPath([[55, 150], [150, 65], [245, 150]])),
      region(roundRectPath(80, 146, 140, 114, 6)),
      region(roundRectPath(100, 170, 32, 32, 5)),
      region(roundRectPath(168, 170, 32, 32, 5)),
      region(roundRectPath(136, 200, 28, 60, 8)),
    ],
    decorations: (ctx) => {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      for (const [x, y] of [
        [100, 170],
        [168, 170],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(x + 16, y);
        ctx.lineTo(x + 16, y + 32);
        ctx.moveTo(x, y + 16);
        ctx.lineTo(x + 32, y + 16);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffe36e';
      ctx.beginPath();
      ctx.arc(157, 232, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (const [x, y, r] of [
        [212, 70, 9],
        [220, 56, 6],
        [226, 44, 4],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

const PICTURES: ReadonlyArray<() => Picture> = [
  makeBunny,
  makeFlower,
  makeCar,
  makeFish,
  makeHouse,
];

class ColoringGame extends CanvasGame {
  private picture: Picture = makeBunny();
  private pictureIndex = 0;
  private selected = 0;
  private particles = new Particles();
  private time = 0;
  private celebrate = 0;

  private art = { x: 0, y: 0, size: 0 };
  private palette = { y: 0, radius: 17, gap: 8, startX: 0, step: 42 };

  protected onMount(): void {
    this.loadPicture(0);
  }

  protected onResize(): void {
    this.layout();
  }

  private layout(): void {
    const paletteY = this.height - 72;
    const artTop = 92;
    const artBottom = this.height - 150;
    const size = Math.max(
      120,
      Math.min(this.width - 48, artBottom - artTop),
    );

    this.art = {
      x: (this.width - size) / 2,
      y: artTop + (artBottom - artTop - size) / 2,
      size,
    };

    const gap = 8;
    const available = Math.max(120, this.width - 48);
    const radius = Math.max(
      8,
      Math.min(17, (available - (PALETTE.length - 1) * gap) / (PALETTE.length * 2)),
    );
    const step = radius * 2 + gap;
    const total = PALETTE.length * radius * 2 + (PALETTE.length - 1) * gap;

    this.palette = {
      y: paletteY,
      radius,
      gap,
      step,
      startX: (this.width - total) / 2 + radius,
    };
  }

  private loadPicture(index: number): void {
    this.pictureIndex = index % PICTURES.length;
    const factory = PICTURES[this.pictureIndex];
    if (factory) {
      this.picture = factory();
    }
    this.selected = 0;
    this.celebrate = 0;
  }

  protected update(dt: number): void {
    this.time += dt;

    if (this.celebrate > 0) {
      this.celebrate -= dt;
      if (this.celebrate <= 0) {
        this.loadPicture(this.pictureIndex + 1);
      }
    }

    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawPaper(ctx);
    this.drawPicture(ctx);
    this.drawPalette(ctx);
    this.particles.draw(ctx);
  }

  protected onTap(x: number, y: number): void {
    if (this.celebrate > 0) {
      return;
    }

    for (let index = 0; index < PALETTE.length; index++) {
      const px = this.palette.startX + index * this.palette.step;
      const reach = this.palette.radius * 1.25;
      const dx = x - px;
      const dy = y - this.palette.y;
      if (dx * dx + dy * dy <= reach * reach) {
        this.selected = index;
        sound.pop(0.9);
        return;
      }
    }

    if (
      x < this.art.x ||
      x > this.art.x + this.art.size ||
      y < this.art.y ||
      y > this.art.y + this.art.size
    ) {
      return;
    }

    const scale = this.art.size / DESIGN;
    const localX = (x - this.art.x) / scale;
    const localY = (y - this.art.y) / scale;
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    let hit: Region | null = null;
    for (let index = this.picture.regions.length - 1; index >= 0; index--) {
      const candidate = this.picture.regions[index];
      if (candidate && ctx.isPointInPath(candidate.path, localX, localY)) {
        hit = candidate;
        break;
      }
    }
    ctx.restore();

    if (!hit) {
      return;
    }

    const color = PALETTE[this.selected];
    hit.color = color;
    sound.pop(0.85 + this.selected * 0.03);

    this.particles.burst(x, y, {
      count: 8,
      colors: [color, '#ffffff'],
      minSpeed: 30,
      maxSpeed: 120,
      life: 0.5,
      gravity: 80,
      size: 3,
    });

    if (this.picture.regions.every((item) => item.color !== null)) {
      this.celebrate = 1.9;
      sound.sparkle();
      this.particles.burst(
        this.art.x + this.art.size / 2,
        this.art.y + this.art.size / 2,
        {
          count: 44,
          colors: ['#ffe36e', '#ff9ecb', '#a78bfa', '#ffffff', '#8fe3c8'],
          minSpeed: 80,
          maxSpeed: 340,
          life: 1,
          size: 4,
          gravity: 220,
        },
      );
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#e6f6ff');
    gradient.addColorStop(1, '#ffe6f3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let index = 0; index < 14; index++) {
      const x = ((index * 97 + this.time * 6) % (this.width + 40)) - 20;
      const y = 100 + ((index * 53) % Math.max(1, this.height - 220));
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + (index % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPaper(ctx: CanvasRenderingContext2D): void {
    const pad = 14;
    ctx.save();
    ctx.shadowColor = 'rgba(90, 50, 120, 0.2)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(
      this.art.x - pad,
      this.art.y - pad,
      this.art.size + pad * 2,
      this.art.size + pad * 2,
      28,
    );
    ctx.fill();
    ctx.restore();
  }

  private drawPicture(ctx: CanvasRenderingContext2D): void {
    const scale = this.art.size / DESIGN;
    const pulse =
      this.celebrate > 0
        ? 1 + Math.sin(this.celebrate * Math.PI * 3) * 0.025
        : 1;

    ctx.save();
    ctx.translate(
      this.art.x + this.art.size / 2,
      this.art.y + this.art.size / 2,
    );
    ctx.scale(scale * pulse, scale * pulse);
    ctx.translate(-DESIGN / 2, -DESIGN / 2);

    for (const item of this.picture.regions) {
      ctx.fillStyle = item.color ?? '#fbfaff';
      ctx.fill(item.path);
    }

    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    for (const item of this.picture.regions) {
      ctx.stroke(item.path);
    }

    this.picture.decorations(ctx);
    ctx.restore();
  }

  private drawPalette(ctx: CanvasRenderingContext2D): void {
    const { y, radius, step, startX } = this.palette;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.roundRect(
      16,
      y - radius - 14,
      this.width - 32,
      radius * 2 + 28,
      radius + 14,
    );
    ctx.fill();

    for (let index = 0; index < PALETTE.length; index++) {
      const px = startX + index * step;
      const selected = this.selected === index;
      const lift = selected ? 4 : 0;
      const cy = y - lift;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, cy, radius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PALETTE[index];
      ctx.beginPath();
      ctx.arc(px, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(px - radius * 0.3, cy - radius * 0.3, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, cy, radius * 1.32, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

export const coloringGame: GameDefinition = {
  id: 'coloring',
  title: 'Раскраска',
  icon: '🎨',
  colors: ['#ffd36e', '#ff6f91'],
  create: () => new ColoringGame(),
};
