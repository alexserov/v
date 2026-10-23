import {
  ANIMAL_KINDS,
  animalBodyColor,
  drawAnimalHead,
  type AnimalKind,
} from '../../art/characters';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import type { GameDefinition } from '../../types';

interface Spot {
  x: number;
  y: number;
  radius: number;
  animal: AnimalKind;
  tone: number;
  revealed: boolean;
  reveal: number;
  peek: number;
  peekTimer: number;
  wavePhase: number;
  bob: number;
  sway: number;
  bounce: number;
}

const BUSH_PALETTES = [
  { main: '#63c06b', light: '#8fdc8a', dark: '#4da85a' },
  { main: '#5aa96b', light: '#87d69a', dark: '#468a57' },
  { main: '#6cc47a', light: '#a0e3a5', dark: '#50a35f' },
];

const LAYOUT: ReadonlyArray<readonly [number, number]> = [
  [0.22, 0.36],
  [0.52, 0.3],
  [0.8, 0.38],
  [0.32, 0.64],
  [0.68, 0.66],
];

const PEEK_DURATION = 1.25;
const mod = (value: number, span: number) => ((value % span) + span) % span;

class PeekabooGame extends CanvasGame {
  private spots: Spot[] = [];
  private particles = new Particles();
  private target: AnimalKind = 'bunny';

  private targetCard: HTMLElement | null = null;
  private targetCanvas: HTMLCanvasElement | null = null;
  private targetBadge: HTMLElement | null = null;

  private roundWon = false;
  private resetTimer: number | null = null;
  private time = 0;

  protected onMount(): void {
    if (!this.host) {
      return;
    }
    this.createTargetCard(this.host);
    this.newRound();
  }

  protected onDestroy(): void {
    this.targetCard?.remove();
    this.targetCard = null;
    this.targetCanvas = null;
    this.targetBadge = null;
  }

  protected onResize(): void {
    if (this.spots.length > 0) {
      this.newRound();
    }
  }

  private createTargetCard(host: HTMLElement): void {
    const card = document.createElement('div');
    card.className = 'peekaboo-target';

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const badge = document.createElement('span');
    badge.className = 'peekaboo-target__badge';
    badge.textContent = '🔍';

    card.append(canvas, badge);
    card.addEventListener('animationend', (event) => {
      if (event.animationName === 'target-wrong') {
        card.classList.remove('is-wrong');
      }
    });

    host.append(card);
    this.targetCard = card;
    this.targetCanvas = canvas;
    this.targetBadge = badge;
  }

  private newRound(): void {
    this.target =
      ANIMAL_KINDS[Math.floor(Math.random() * ANIMAL_KINDS.length)] ?? 'bunny';

    const others = ANIMAL_KINDS.filter((kind) => kind !== this.target);
    shuffle(others);

    const targetIndex = Math.floor(Math.random() * LAYOUT.length);
    const baseRadius = Math.min(this.width * 0.135, this.height * 0.075);
    let otherIndex = 0;

    this.spots = LAYOUT.map(([fx, fy], index) => {
      let animal: AnimalKind;
      if (index === targetIndex) {
        animal = this.target;
      } else {
        animal = others[otherIndex % others.length] ?? 'bear';
        otherIndex += 1;
      }

      return {
        x: this.width * (fx + (Math.random() - 0.5) * 0.04),
        y: this.height * (fy + (Math.random() - 0.5) * 0.03),
        radius: baseRadius * (0.88 + Math.random() * 0.22),
        animal,
        tone: index % BUSH_PALETTES.length,
        revealed: false,
        reveal: 0,
        peek: 0,
        peekTimer: 0,
        wavePhase: Math.random() * Math.PI * 2,
        bob: Math.random() * Math.PI * 2,
        sway: Math.random() * Math.PI * 2,
        bounce: 0,
      };
    });

    this.roundWon = false;
    this.resetTimer = null;
    this.updateTargetCard();
    sound.chime(0);
  }

  private updateTargetCard(): void {
    if (!this.targetCanvas) {
      return;
    }
    const ctx = this.targetCanvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 64, 64);
    ctx.translate(32, 38);
    drawAnimalHead(ctx, this.target, 20, {
      expression: 'happy',
      blush: true,
    });

    if (this.targetBadge) {
      this.targetBadge.textContent = '🔍';
    }
    this.targetCard?.classList.remove('is-found');
  }

  private setTargetFound(found: boolean): void {
    this.targetCard?.classList.toggle('is-found', found);
    if (this.targetBadge) {
      this.targetBadge.textContent = found ? '✅' : '🔍';
    }
  }

  private flashWrong(): void {
    const card = this.targetCard;
    if (!card) {
      return;
    }
    card.classList.remove('is-wrong');
    void card.offsetWidth;
    card.classList.add('is-wrong');
  }

  protected update(dt: number): void {
    this.time += dt;

    for (const spot of this.spots) {
      spot.bob += dt * 2.2;
      spot.sway += dt * (0.7 + (spot.tone + 1) * 0.15);
      spot.bounce = Math.max(0, spot.bounce - dt * 3);

      if (spot.revealed && spot.reveal < 1) {
        spot.reveal = Math.min(1, spot.reveal + dt * 3.6);
      }

      if (spot.peekTimer > 0) {
        spot.peekTimer = Math.max(0, spot.peekTimer - dt);
        const elapsed = PEEK_DURATION - spot.peekTimer;
        if (elapsed < 0.18) {
          spot.peek = elapsed / 0.18;
        } else if (elapsed < 0.95) {
          spot.peek = 1;
        } else {
          spot.peek = Math.max(
            0,
            (PEEK_DURATION - elapsed) / (PEEK_DURATION - 0.95),
          );
        }
        spot.wavePhase += dt * 14;
      } else {
        spot.peek = 0;
      }
    }

    this.particles.update(dt);

    if (this.roundWon && this.resetTimer !== null) {
      this.resetTimer -= dt;
      if (this.resetTimer <= 0) {
        this.newRound();
      }
    }
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);

    const sorted = [...this.spots].sort((a, b) => a.y - b.y);
    for (const spot of sorted) {
      this.drawSpot(ctx, spot);
    }

    this.particles.draw(ctx);
  }

  protected onTap(x: number, y: number): void {
    if (this.roundWon) {
      return;
    }

    for (const spot of this.spots) {
      const dx = x - spot.x;
      const dy = y - (spot.y - spot.radius * 0.3);
      const reach = spot.radius * 1.15;
      if (dx * dx + dy * dy > reach * reach) {
        continue;
      }

      if (spot.animal === this.target) {
        this.win(spot);
      } else {
        this.wrong(spot);
      }
      return;
    }
  }

  private win(spot: Spot): void {
    spot.revealed = true;
    spot.reveal = 0;
    spot.bounce = 1;
    spot.peek = 0;
    spot.peekTimer = 0;

    this.roundWon = true;
    this.resetTimer = 1.8;
    this.setTargetFound(true);
    sound.sparkle();

    this.particles.burst(spot.x, spot.y - spot.radius, {
      count: 22,
      colors: ['#ffe36e', '#ffffff', '#8fe3c8', '#ffc2e8', '#a78bfa'],
      minSpeed: 50,
      maxSpeed: 210,
      life: 0.8,
      gravity: 220,
    });
    this.particles.hearts(spot.x, spot.y - spot.radius * 1.3, 10);
  }

  private wrong(spot: Spot): void {
    spot.peekTimer = PEEK_DURATION;
    spot.wavePhase = 0;
    spot.bounce = 1;
    sound.nope();
    this.flashWrong();
  }

  private drawSpot(ctx: CanvasRenderingContext2D, spot: Spot): void {
    const r = spot.radius;
    const eased = 1 - Math.pow(1 - spot.reveal, 3);
    const bounceLift = Math.sin(spot.bounce * Math.PI) * r * 0.18;
    const peekLift = spot.peek * r * 0.55;
    const bob = Math.sin(spot.bob) * r * 0.04;
    const sway = Math.sin(spot.sway) * r * 0.03;

    const headY =
      spot.y - r * 0.75 - eased * r * 0.35 - peekLift - bounceLift + bob;
    const headRadius = r * 0.55;

    ctx.save();
    ctx.translate(spot.x + sway, headY);
    drawAnimalHead(ctx, spot.animal, headRadius, {
      expression:
        spot.peek > 0.1 ? 'wink' : spot.revealed ? 'happy' : 'sleepy',
      blush: true,
    });
    ctx.restore();

    if (spot.peek > 0.05) {
      this.drawPaw(ctx, spot, headY, r);
    }

    const bushY = spot.y + eased * r * 0.55;
    drawBush(
      ctx,
      spot.x + sway * 0.5,
      bushY,
      r,
      BUSH_PALETTES[spot.tone],
      spot.sway,
    );
  }

  private drawPaw(
    ctx: CanvasRenderingContext2D,
    spot: Spot,
    headY: number,
    r: number,
  ): void {
    const color = animalBodyColor(spot.animal);
    const shoulderX = spot.x + r * 0.45;
    const shoulderY = headY + r * 0.5;
    const angle = -1.05 + Math.sin(spot.wavePhase) * 0.42;
    const armLength = r * 0.62;
    const pawX = shoulderX + Math.cos(angle) * armLength;
    const pawY = shoulderY + Math.sin(angle) * armLength;

    ctx.save();
    ctx.globalAlpha = Math.min(1, spot.peek * 1.4);

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, r * 0.16);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(pawX, pawY);
    ctx.stroke();

    ctx.fillStyle = color;
    fillCircle(ctx, pawX, pawY, r * 0.17);

    ctx.fillStyle = 'rgba(255, 140, 185, 0.7)';
    fillCircle(ctx, pawX - r * 0.05, pawY - r * 0.05, r * 0.045);
    fillCircle(ctx, pawX + r * 0.04, pawY - r * 0.06, r * 0.04);
    fillCircle(ctx, pawX, pawY + r * 0.05, r * 0.045);

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#c9ecff');
    sky.addColorStop(0.55, '#ffe8f3');
    sky.addColorStop(1, '#fff3dd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const sunX = width * 0.82;
    const sunY = height * 0.13;
    const sunR = Math.min(width, height) * 0.07;
    const glow = ctx.createRadialGradient(
      sunX,
      sunY,
      sunR * 0.4,
      sunX,
      sunY,
      sunR * 2,
    );
    glow.addColorStop(0, 'rgba(255, 235, 130, 0.55)');
    glow.addColorStop(1, 'rgba(255, 235, 130, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe36e';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    for (let index = 0; index < 3; index++) {
      const span = width + 280;
      const x = mod(index * 240 + 30 + this.time * 6, span) - 140;
      const y = height * 0.11 + (index % 2) * height * 0.07;
      const size = Math.min(width, height) * 0.037;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      for (const [dx, dy, scale] of [
        [0, 0, 1],
        [0.8, 0.1, 0.75],
        [-0.8, 0.12, 0.65],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + size * dx, y + size * dy, size * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const groundY = height * 0.82;
    ctx.fillStyle = '#c6ecc2';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 8; x += 8) {
      const phase = ((x + this.time * 8) / (width * 1.2)) * Math.PI * 2;
      const y = groundY - Math.sin(phase) * height * 0.04;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    const grass = ctx.createLinearGradient(0, groundY, 0, height);
    grass.addColorStop(0, '#9fe08f');
    grass.addColorStop(1, '#58b766');
    ctx.fillStyle = grass;
    ctx.fillRect(0, groundY + height * 0.02, width, height);

    for (let index = 0; index < 7; index++) {
      const x = mod(index * 63 + this.time * 8, width + 80) - 40;
      const y = groundY + height * (0.05 + (index % 3) * 0.03);
      drawFlower(ctx, x, y, Math.min(width, height) * 0.006, index % 2 === 0);
    }
  }
}

function shuffle<T>(items: T[]): void {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    const temp = items[index];
    items[index] = items[swap] as T;
    items[swap] = temp as T;
  }
}

function drawBush(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  palette: { main: string; light: string; dark: string },
  sway: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(sway) * 0.02);

  ctx.fillStyle = 'rgba(60, 90, 60, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.6, r * 0.95, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.dark;
  ctx.beginPath();
  ctx.roundRect(-r * 0.78, -r * 0.05, r * 1.56, r * 0.68, r * 0.26);
  ctx.fill();

  ctx.fillStyle = palette.main;
  fillCircle(ctx, -r * 0.48, -r * 0.1, r * 0.5);
  fillCircle(ctx, r * 0.48, -r * 0.1, r * 0.5);
  fillCircle(ctx, 0, -r * 0.46, r * 0.56);

  ctx.fillStyle = palette.light;
  fillCircle(ctx, -r * 0.3, -r * 0.34, r * 0.17);
  fillCircle(ctx, r * 0.33, -r * 0.18, r * 0.12);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  fillCircle(ctx, -r * 0.22, -r * 0.55, r * 0.07);
  fillCircle(ctx, r * 0.38, -r * 0.36, r * 0.05);

  ctx.restore();
}

function fillCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  yellow: boolean,
): void {
  ctx.fillStyle = yellow ? '#fff4a8' : '#ffc2e8';
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(angle) * radius * 2,
      y + Math.sin(angle) * radius * 2,
      radius * 1.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export const peekabooGame: GameDefinition = {
  id: 'peekaboo',
  title: 'Найди зверюшку',
  icon: '🐾',
  colors: ['#a8e6a1', '#4caf50'],
  create: () => new PeekabooGame(),
};
