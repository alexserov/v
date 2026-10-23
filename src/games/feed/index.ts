import {
  ANIMAL_KINDS,
  drawSittingAnimal,
  type AnimalKind,
} from '../../art/characters';
import {
  FOOD_KINDS,
  drawFood,
  type FoodKind,
} from '../../art/food';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import { createHud, type Hud } from '../../ui/hud';
import type { GameDefinition } from '../../types';

interface AnimalSlot {
  kind: AnimalKind;
  x: number;
  y: number;
  size: number;
  favorite: FoodKind;
  chew: number;
  joy: number;
  bob: number;
  bounce: number;
}

interface TraySlot {
  kind: FoodKind;
  x: number;
  y: number;
  radius: number;
  bounce: number;
}

interface FlyingFood {
  kind: FoodKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  animal: number;
  t: number;
  radius: number;
}

interface Tray {
  x: number;
  y: number;
  width: number;
  height: number;
}

const randomFood = (): FoodKind =>
  FOOD_KINDS[Math.floor(Math.random() * FOOD_KINDS.length)];

const mod = (value: number, span: number) => ((value % span) + span) % span;

class FeedGame extends CanvasGame {
  private animals: AnimalSlot[] = [];
  private slots: TraySlot[] = [];
  private tray: Tray = { x: 0, y: 0, width: 0, height: 0 };
  private flying: FlyingFood[] = [];
  private particles = new Particles();
  private hud: Hud | null = null;
  private selected: number | null = null;
  private treats = 0;
  private time = 0;

  protected onMount(): void {
    if (!this.host) {
      return;
    }
    this.hud = createHud(this.host, { icon: '🍎', initial: this.treats });
    this.layout();
  }

  protected onDestroy(): void {
    this.hud?.destroy();
    this.hud = null;
  }

  protected onResize(): void {
    this.layout();
  }

  private layout(): void {
    const side = Math.min(this.width, this.height);
    const size = side * 0.075;
    const groundTop = this.height * 0.62;

    const kinds: AnimalKind[] = ['bunny', 'bear', 'fox'];
    this.animals = kinds.map((kind, index) => ({
      kind,
      x: this.width * (0.23 + index * 0.27),
      y: groundTop - size * 1.35,
      size,
      favorite: randomFood(),
      chew: 0,
      joy: 0,
      bob: Math.random() * Math.PI * 2,
      bounce: 0,
    }));

    const trayHeight = this.height * 0.15;
    this.tray = {
      x: this.width * 0.05,
      y: this.height * 0.8,
      width: this.width * 0.9,
      height: trayHeight,
    };

    const slotRadius = Math.min(
      trayHeight * 0.32,
      (this.tray.width / 5) * 0.4,
    );

    this.slots = Array.from({ length: 5 }, (_, index) => ({
      kind: randomFood(),
      x: this.tray.x + this.tray.width * ((index + 0.5) / 5),
      y: this.tray.y + this.tray.height * 0.55,
      radius: slotRadius,
      bounce: 0,
    }));

    this.selected = null;
    this.flying = [];
  }

  protected update(dt: number): void {
    this.time += dt;

    for (const animal of this.animals) {
      animal.chew = Math.max(0, animal.chew - dt * 1.4);
      animal.joy = Math.max(0, animal.joy - dt * 1.2);
      animal.bounce = Math.max(0, animal.bounce - dt * 2.5);
      animal.bob += dt * 1.8;
    }

    for (const slot of this.slots) {
      slot.bounce = Math.max(0, slot.bounce - dt * 3);
    }

    for (const food of this.flying) {
      food.t += dt * 2.4;
      if (food.t >= 1) {
        this.completeFeed(food);
      }
    }
    this.flying = this.flying.filter((food) => food.t < 1);

    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawBlanket(ctx);

    for (const animal of this.animals) {
      this.drawAnimal(ctx, animal);
    }

    this.drawTray(ctx);

    for (const food of this.flying) {
      const t = food.t;
      const x = food.fromX + (food.toX - food.fromX) * t;
      const y =
        food.fromY +
        (food.toY - food.fromY) * t -
        Math.sin(t * Math.PI) * food.radius * 3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * Math.PI) * 0.4);
      drawFood(ctx, food.kind, food.radius);
      ctx.restore();
    }

    this.particles.draw(ctx);
  }

  protected onTap(x: number, y: number): void {
    for (let index = 0; index < this.slots.length; index++) {
      const slot = this.slots[index];
      const dx = x - slot.x;
      const dy = y - slot.y;
      if (dx * dx + dy * dy <= (slot.radius * 1.15) ** 2) {
        this.selected = index;
        slot.bounce = 1;
        sound.pop(1.1);
        return;
      }
    }

    for (let index = 0; index < this.animals.length; index++) {
      const animal = this.animals[index];
      const withinX = Math.abs(x - animal.x) < animal.size * 1.2;
      const withinY =
        y > animal.y - animal.size * 1.7 &&
        y < animal.y + animal.size * 1.8;

      if (!withinX || !withinY) {
        continue;
      }

      if (this.selected !== null) {
        this.flyTo(this.selected, index);
      } else {
        animal.bounce = 1;
        sound.chime(Math.floor(Math.random() * 5));
      }
      return;
    }

    this.selected = null;
  }

  private flyTo(slotIndex: number, animalIndex: number): void {
    const slot = this.slots[slotIndex];
    const animal = this.animals[animalIndex];
    if (!slot || !animal) {
      return;
    }

    this.flying.push({
      kind: slot.kind,
      fromX: slot.x,
      fromY: slot.y - slot.radius * 0.4,
      toX: animal.x,
      toY: animal.y - animal.size * 0.15,
      animal: animalIndex,
      t: 0,
      radius: slot.radius * 0.55,
    });

    slot.kind = randomFood();
    slot.bounce = 1;
    this.selected = null;
    sound.pop(1.3);
  }

  private completeFeed(food: FlyingFood): void {
    const animal = this.animals[food.animal];
    if (!animal) {
      return;
    }

    animal.chew = 1;
    animal.joy = 1;

    this.treats += 1;
    this.hud?.setValue(this.treats);
    sound.munch();

    const favorite = animal.favorite === food.kind;
    this.particles.hearts(
      animal.x,
      animal.y - animal.size * 0.4,
      favorite ? 14 : 7,
    );

    if (favorite) {
      sound.sparkle();
      this.particles.burst(animal.x, animal.y, {
        count: 12,
        colors: ['#ffe36e', '#ff9ecb', '#ffffff'],
        minSpeed: 50,
        maxSpeed: 170,
        life: 0.7,
        gravity: 120,
        size: 3.5,
      });
    }

    if (this.treats % 6 === 0) {
      this.swapGuest();
    }
  }

  private swapGuest(): void {
    const index = Math.floor(Math.random() * this.animals.length);
    const animal = this.animals[index];
    if (!animal) {
      return;
    }

    const present = new Set(this.animals.map((item) => item.kind));
    const candidates = ANIMAL_KINDS.filter((kind) => !present.has(kind));
    const kind =
      candidates[Math.floor(Math.random() * candidates.length)] ??
      ANIMAL_KINDS[0];

    animal.kind = kind;
    animal.favorite = randomFood();
    animal.bounce = 1;
    animal.joy = 1;

    sound.sparkle();
    this.particles.burst(animal.x, animal.y, {
      count: 16,
      colors: ['#ffe36e', '#ff9ecb', '#a78bfa', '#ffffff'],
      minSpeed: 50,
      maxSpeed: 190,
      life: 0.8,
      gravity: 120,
      size: 3.5,
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(0.6, '#ffe2f1');
    sky.addColorStop(1, '#fff0d9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.7);

    const sunX = width * 0.82;
    const sunY = height * 0.12;
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

    for (let index = 0; index < 4; index++) {
      const span = width + 280;
      const x = mod(index * 210 + 30 + this.time * 6, span) - 140;
      const y = height * 0.1 + (index % 2) * height * 0.06;
      const size = Math.min(width, height) * 0.036;
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

    const groundTop = height * 0.62;
    const ground = ctx.createLinearGradient(0, groundTop, 0, height);
    ground.addColorStop(0, '#b3e8a8');
    ground.addColorStop(0.5, '#86d97f');
    ground.addColorStop(1, '#58b766');
    ctx.fillStyle = ground;

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 8; x += 8) {
      const phase = ((x + this.time * 7) / (width * 1.3)) * Math.PI * 2;
      const y = groundTop - Math.sin(phase) * height * 0.022;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  private drawBlanket(ctx: CanvasRenderingContext2D): void {
    const size = this.animals[0]?.size ?? Math.min(this.width, this.height) * 0.058;
    const cx = this.width / 2;
    const cy = this.height * 0.62 + size * 0.55;
    const rx = this.width * 0.44;
    const ry = this.height * 0.055;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#ffd9e8';
    ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);

    const step = this.width * 0.07;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let x = cx - rx; x < cx + rx; x += step * 2) {
      ctx.fillRect(x, cy - ry, step, ry * 2);
    }
    for (let y = cy - ry; y < cy + ry; y += step) {
      ctx.fillRect(cx - rx, y, rx * 2, step * 0.4);
    }

    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawAnimal(
    ctx: CanvasRenderingContext2D,
    animal: AnimalSlot,
  ): void {
    const bounceLift = Math.sin(animal.bounce * Math.PI) * animal.size * 0.2;
    const chewLift =
      Math.abs(Math.sin(animal.chew * Math.PI * 2)) * animal.size * 0.14;
    const bob = Math.sin(animal.bob) * animal.size * 0.03;
    const y = animal.y - bounceLift - chewLift + bob;
    const scale = 1 + animal.joy * 0.05;

    ctx.save();
    ctx.translate(animal.x, y);
    ctx.scale(scale, scale);
    drawSittingAnimal(ctx, animal.kind, animal.size, {
      expression: animal.chew > 0.05 ? 'wink' : 'happy',
      blush: true,
    });
    ctx.restore();

    if (animal.chew < 0.08) {
      this.drawThought(ctx, animal, y);
    }
  }

  private drawThought(
    ctx: CanvasRenderingContext2D,
    animal: AnimalSlot,
    headY: number,
  ): void {
    const size = animal.size;
    const bubbleY = headY - size * 1.85;
    const radius = size * 0.82;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    for (const [dx, dy, scale] of [
      [0, 0, 1],
      [-0.62, 0.12, 0.42],
      [0.62, 0.12, 0.42],
    ] as const) {
      ctx.beginPath();
      ctx.arc(
        animal.x + radius * dx,
        bubbleY + radius * dy,
        radius * scale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    for (const [dx, dy, scale] of [
      [-0.45, 0.95, 0.16],
      [-0.3, 1.2, 0.1],
    ] as const) {
      ctx.beginPath();
      ctx.arc(
        animal.x + radius * dx,
        bubbleY + radius * dy,
        radius * scale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.save();
    ctx.translate(animal.x, bubbleY);
    drawFood(ctx, animal.favorite, radius * 0.52);
    ctx.restore();
  }

  private drawTray(ctx: CanvasRenderingContext2D): void {
    const tray = this.tray;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.roundRect(tray.x, tray.y, tray.width, tray.height, tray.height * 0.35);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let index = 0; index < this.slots.length; index++) {
      const slot = this.slots[index];
      const selected = this.selected === index;
      const lift =
        Math.max(0, Math.sin(slot.bounce * Math.PI)) * slot.radius * 0.22;

      ctx.fillStyle = selected
        ? 'rgba(255, 255, 255, 0.98)'
        : 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = '#ff8fbf';
        ctx.lineWidth = Math.max(3, slot.radius * 0.12);
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, slot.radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(slot.x, slot.y - lift - (selected ? slot.radius * 0.12 : 0));
      drawFood(ctx, slot.kind, slot.radius * 0.68);
      ctx.restore();
    }
  }
}

export const feedGame: GameDefinition = {
  id: 'feed',
  title: 'Покорми зверят',
  icon: '🍎',
  colors: ['#ffc2dd', '#ff7fb6'],
  create: () => new FeedGame(),
};
