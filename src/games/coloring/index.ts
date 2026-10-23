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

interface HistoryEntry {
  id: string;
  colors: (string | null)[];
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
const CONTENT_SCALE = 1.06;
const HISTORY_LIMIT = 20;
const STORAGE_KEY = 'mini-games:coloring:v1';
const outline = '#4a2b5e';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

function drawMouth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(2, r * 0.4);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

// --- Pictures ---

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

function makeBear(): Picture {
  return {
    name: 'Мишутка',
    regions: [
      region(circlePath(108, 85, 30)),
      region(circlePath(192, 85, 30)),
      region(ellipsePath(150, 226, 64, 60)),
      region(circlePath(150, 140, 62)),
      region(ellipsePath(150, 232, 34, 40)),
      region(ellipsePath(112, 272, 26, 13)),
      region(ellipsePath(188, 272, 26, 13)),
      region(ellipsePath(150, 162, 32, 25)),
    ],
    decorations: (ctx) => {
      ctx.fillStyle = 'rgba(255, 140, 185, 0.5)';
      ctx.beginPath();
      ctx.arc(112, 170, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(188, 170, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(128, 132, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(172, 132, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(126, 129, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(170, 129, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.ellipse(150, 155, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      drawMouth(ctx, 150, 168, 8);
    },
  };
}

function makeCat(): Picture {
  const tail = new Path2D();
  tail.moveTo(205, 250);
  tail.quadraticCurveTo(258, 242, 252, 188);
  tail.quadraticCurveTo(244, 228, 203, 235);
  tail.closePath();

  return {
    name: 'Котёнок',
    regions: [
      region(tail),
      region(polygonPath([[95, 95], [72, 38], [145, 78]])),
      region(polygonPath([[205, 95], [228, 38], [155, 78]])),
      region(ellipsePath(150, 226, 64, 60)),
      region(circlePath(150, 140, 60)),
      region(ellipsePath(150, 232, 34, 40)),
      region(ellipsePath(112, 272, 24, 12)),
      region(ellipsePath(188, 272, 24, 12)),
    ],
    decorations: (ctx) => {
      ctx.fillStyle = 'rgba(255, 140, 185, 0.45)';
      ctx.beginPath();
      ctx.arc(112, 168, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(188, 168, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(128, 132, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(172, 132, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(126, 129, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(170, 129, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff8fbf';
      ctx.beginPath();
      ctx.moveTo(150, 152);
      ctx.lineTo(139, 143);
      ctx.lineTo(161, 143);
      ctx.closePath();
      ctx.fill();
      drawMouth(ctx, 150, 160, 8);

      ctx.strokeStyle = 'rgba(74, 43, 94, 0.45)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (const step of [0, 1]) {
          ctx.beginPath();
          ctx.moveTo(150 + side * 30, 155 + step * 8);
          ctx.lineTo(150 + side * 78, 150 + step * 13);
          ctx.stroke();
        }
      }
    },
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

function makeMushroom(): Picture {
  const cap = new Path2D();
  cap.moveTo(60, 178);
  cap.quadraticCurveTo(75, 60, 150, 60);
  cap.quadraticCurveTo(225, 60, 240, 178);
  cap.quadraticCurveTo(150, 195, 60, 178);
  cap.closePath();

  return {
    name: 'Грибок',
    regions: [
      region(roundRectPath(130, 170, 40, 95, 18)),
      region(cap),
      region(ellipsePath(110, 120, 17, 15)),
      region(ellipsePath(184, 116, 13, 12)),
      region(ellipsePath(150, 150, 10, 9)),
    ],
    decorations: (ctx) => {
      ctx.fillStyle = 'rgba(255, 140, 185, 0.45)';
      ctx.beginPath();
      ctx.arc(136, 215, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(164, 215, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(141, 205, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(159, 205, 5, 0, Math.PI * 2);
      ctx.fill();
      drawMouth(ctx, 150, 218, 9);
    },
  };
}

function makeButterfly(): Picture {
  return {
    name: 'Бабочка',
    regions: [
      region(ellipsePath(105, 205, 45, 38, 0.3)),
      region(ellipsePath(195, 205, 45, 38, -0.3)),
      region(ellipsePath(95, 130, 55, 45, -0.4)),
      region(ellipsePath(205, 130, 55, 45, 0.4)),
      region(circlePath(150, 100, 16)),
      region(ellipsePath(150, 165, 14, 58)),
    ],
    decorations: (ctx) => {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(144, 88);
      ctx.quadraticCurveTo(128, 65, 120, 48);
      ctx.moveTo(156, 88);
      ctx.quadraticCurveTo(172, 65, 180, 48);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (const [x, y, r] of [
        [85, 125, 11],
        [215, 125, 11],
        [115, 205, 9],
        [185, 205, 9],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(144, 98, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(156, 98, 3, 0, Math.PI * 2);
      ctx.fill();
      drawMouth(ctx, 150, 104, 5);
    },
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

function makeBoat(): Picture {
  const hull = new Path2D();
  hull.moveTo(55, 190);
  hull.lineTo(245, 190);
  hull.quadraticCurveTo(225, 245, 150, 245);
  hull.quadraticCurveTo(75, 245, 55, 190);
  hull.closePath();

  return {
    name: 'Кораблик',
    regions: [
      region(hull),
      region(polygonPath([[150, 60], [150, 180], [225, 180]])),
      region(polygonPath([[150, 85], [150, 180], [85, 180]])),
      region(polygonPath([[150, 55], [182, 68], [150, 80]])),
    ],
    decorations: (ctx) => {
      ctx.strokeStyle = '#9a6b4a';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(150, 55);
      ctx.lineTo(150, 190);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(120, 190, 240, 0.85)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (const [x, y] of [
        [100, 260],
        [150, 270],
        [200, 260],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x, y, 28, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
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

function makeIceCream(): Picture {
  const cone = polygonPath([[105, 150], [195, 150], [150, 265]]);

  return {
    name: 'Мороженое',
    regions: [
      region(cone),
      region(circlePath(122, 130, 38)),
      region(circlePath(178, 130, 38)),
      region(circlePath(150, 90, 42)),
      region(circlePath(150, 45, 14)),
    ],
    decorations: (ctx) => {
      ctx.save();
      ctx.clip(cone);
      ctx.strokeStyle = 'rgba(154, 107, 74, 0.65)';
      ctx.lineWidth = 4;
      for (let index = -3; index <= 3; index++) {
        ctx.beginPath();
        ctx.moveTo(150 + index * 22 - 40, 145);
        ctx.lineTo(150 + index * 22 + 40, 265);
        ctx.stroke();
      }
      for (let index = -3; index <= 3; index++) {
        ctx.beginPath();
        ctx.moveTo(150 + index * 22 + 40, 145);
        ctx.lineTo(150 + index * 22 - 40, 265);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(136, 90, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(164, 90, 5, 0, Math.PI * 2);
      ctx.fill();
      drawMouth(ctx, 150, 102, 9);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (const [x, y, r] of [
        [100, 125, 4],
        [200, 125, 4],
        [115, 145, 3],
        [185, 145, 3],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#5cbb66';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(150, 33);
      ctx.quadraticCurveTo(158, 20, 170, 18);
      ctx.stroke();
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

const PICTURES: Readonly<Record<string, () => Picture>> = {
  bunny: makeBunny,
  bear: makeBear,
  cat: makeCat,
  flower: makeFlower,
  mushroom: makeMushroom,
  butterfly: makeButterfly,
  car: makeCar,
  boat: makeBoat,
  fish: makeFish,
  icecream: makeIceCream,
  house: makeHouse,
};

const PICTURE_IDS = Object.keys(PICTURES);

class ColoringGame extends CanvasGame {
  private picture: Picture = makeBunny();
  private selected = 0;
  private particles = new Particles();
  private time = 0;
  private celebrate = 0;

  private history: HistoryEntry[] = [];
  private historyIndex = 0;

  private toolbar: HTMLElement | null = null;
  private prevButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;
  private clearButton: HTMLButtonElement | null = null;

  private art = { x: 0, y: 0, size: 0 };
  private palette = { y: 0, radius: 17, gap: 8, startX: 0, step: 42 };

  protected onMount(): void {
    if (!this.host) {
      return;
    }
    this.createToolbar(this.host);
    this.restoreHistory();
  }

  protected onDestroy(): void {
    this.toolbar?.remove();
    this.toolbar = null;
    this.prevButton = null;
    this.nextButton = null;
    this.clearButton = null;
  }

  protected onResize(): void {
    this.layout();
  }

  private layout(): void {
    const paletteY = this.height - 72;
    const artTop = 92;
    const artBottom = this.height - 190;
    const size = Math.max(
      120,
      Math.min(this.width - 36, artBottom - artTop),
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
      Math.min(
        17,
        (available - (PALETTE.length - 1) * gap) / (PALETTE.length * 2),
      ),
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

  private createToolbar(host: HTMLElement): void {
    const bar = document.createElement('div');
    bar.className = 'coloring-toolbar';

    const makeButton = (
      icon: string,
      label: string,
      handler: () => void,
    ): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'coloring-tool';
      button.setAttribute('aria-label', label);

      const iconEl = document.createElement('span');
      iconEl.className = 'coloring-tool__icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.textContent = icon;

      const labelEl = document.createElement('span');
      labelEl.className = 'coloring-tool__label';
      labelEl.textContent = label;

      button.append(iconEl, labelEl);
      button.addEventListener('click', (event) => {
        event.preventDefault();
        handler();
      });
      return button;
    };

    this.prevButton = makeButton('◀', 'Раньше', () => this.goToHistory(-1));
    this.clearButton = makeButton('🧽', 'Очистить', () =>
      this.clearPicture(),
    );
    const newButton = makeButton('✨', 'Новая', () => this.addNewPicture());
    this.nextButton = makeButton('▶', 'Позже', () => this.goToHistory(1));

    bar.append(
      this.prevButton,
      this.clearButton,
      newButton,
      this.nextButton,
    );
    host.append(bar);
    this.toolbar = bar;
  }

  private syncToolbar(): void {
    if (this.prevButton) {
      this.prevButton.disabled = this.historyIndex <= 0;
    }
    if (this.nextButton) {
      this.nextButton.disabled =
        this.historyIndex >= this.history.length - 1;
    }
    if (this.clearButton) {
      this.clearButton.disabled = this.picture.regions.every(
        (item) => item.color === null,
      );
    }
  }

  private currentEntry(): HistoryEntry | undefined {
    return this.history[this.historyIndex];
  }

  private updateCurrentEntry(): void {
    const entry = this.currentEntry();
    if (!entry) {
      return;
    }
    entry.colors = this.picture.regions.map((item) => item.color);
    this.saveHistory();
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          entries: this.history,
          index: this.historyIndex,
        }),
      );
    } catch {
      // Storage may be unavailable; the game still works in memory.
    }
  }

  private readHistory(): { entries: HistoryEntry[]; index: number } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as {
        entries?: unknown;
        index?: unknown;
      };
      if (!Array.isArray(parsed.entries)) {
        return null;
      }

      const entries: HistoryEntry[] = [];
      for (const item of parsed.entries) {
        if (!item || typeof item !== 'object') {
          continue;
        }
        const record = item as { id?: unknown; colors?: unknown };
        if (
          typeof record.id !== 'string' ||
          !(record.id in PICTURES) ||
          !Array.isArray(record.colors)
        ) {
          continue;
        }
        entries.push({
          id: record.id,
          colors: record.colors.map((color) =>
            typeof color === 'string' ? color : null,
          ),
        });
      }

      if (entries.length === 0) {
        return null;
      }

      const limited = entries.slice(-HISTORY_LIMIT);
      const offset = entries.length - limited.length;
      const rawIndex =
        typeof parsed.index === 'number' ? parsed.index : limited.length - 1;
      return {
        entries: limited,
        index: clamp(Math.round(rawIndex) - offset, 0, limited.length - 1),
      };
    } catch {
      return null;
    }
  }

  private restoreHistory(): void {
    const saved = this.readHistory();
    if (saved) {
      this.history = saved.entries;
      this.historyIndex = saved.index;
      const entry = this.history[this.historyIndex];
      if (entry) {
        this.loadEntry(entry);
      }
    } else {
      this.history = [];
      this.historyIndex = 0;
      this.addNewPicture();
    }
    this.syncToolbar();
  }

  private loadEntry(entry: HistoryEntry): void {
    const factory = PICTURES[entry.id];
    const picture = factory ? factory() : makeBunny();
    picture.regions.forEach((item, index) => {
      item.color = entry.colors[index] ?? null;
    });

    this.picture = picture;
    entry.colors = picture.regions.map((item) => item.color);
    this.celebrate = 0;
    this.particles.clear();
    this.syncToolbar();
  }

  private addNewPicture(): void {
    this.updateCurrentEntry();

    const currentId = this.currentEntry()?.id;
    const choices = PICTURE_IDS.filter((id) => id !== currentId);
    const id =
      choices[Math.floor(Math.random() * choices.length)] ??
      PICTURE_IDS[0] ??
      'bunny';

    this.history = this.history.slice(0, this.historyIndex + 1);
    const entry: HistoryEntry = { id, colors: [] };
    this.history.push(entry);
    if (this.history.length > HISTORY_LIMIT) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;

    this.loadEntry(entry);
    this.saveHistory();
    this.syncToolbar();
    sound.pop(1.2);
  }

  private goToHistory(delta: number): void {
    const next = clamp(
      this.historyIndex + delta,
      0,
      this.history.length - 1,
    );
    if (next === this.historyIndex) {
      return;
    }

    this.updateCurrentEntry();
    this.historyIndex = next;
    const entry = this.history[next];
    if (!entry) {
      return;
    }
    this.loadEntry(entry);
    this.saveHistory();
    sound.pop(1.2);
  }

  private clearPicture(): void {
    for (const item of this.picture.regions) {
      item.color = null;
    }
    this.celebrate = 0;
    this.updateCurrentEntry();
    this.syncToolbar();
    sound.pop(1.2);
  }

  protected update(dt: number): void {
    this.time += dt;

    if (this.celebrate > 0) {
      this.celebrate -= dt;
      if (this.celebrate <= 0) {
        this.addNewPicture();
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
    const centerX = this.art.x + this.art.size / 2;
    const centerY = this.art.y + this.art.size / 2;
    const localX =
      DESIGN / 2 + (x - centerX) / (scale * CONTENT_SCALE);
    const localY =
      DESIGN / 2 + (y - centerY) / (scale * CONTENT_SCALE);

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

    const wasComplete = this.picture.regions.every(
      (item) => item.color !== null,
    );
    const color = PALETTE[this.selected] ?? PALETTE[0];
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

    this.updateCurrentEntry();
    this.syncToolbar();

    if (
      !wasComplete &&
      this.picture.regions.every((item) => item.color !== null)
    ) {
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
    const pad = 10;
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
    ctx.scale(
      scale * pulse * CONTENT_SCALE,
      scale * pulse * CONTENT_SCALE,
    );
    ctx.translate(-DESIGN / 2, -DESIGN / 2);

    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = outline;

    // Fill and outline each part in order, so later parts cover the
    // outlines of earlier ones (the head covers the ears, etc.).
    for (const item of this.picture.regions) {
      ctx.fillStyle = item.color ?? '#fbfaff';
      ctx.fill(item.path);
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
      ctx.arc(
        px - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.28,
        0,
        Math.PI * 2,
      );
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
