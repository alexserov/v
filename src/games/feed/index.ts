import {
  ANIMAL_KINDS,
  animalBodyColor,
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
  need: number;
  fed: number;
  chew: number;
  joy: number;
  bob: number;
  bounce: number;
  idle: number;
  refuse: number;
  leaveDelay: number;
  leaveT: number;
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

const IDLE_THRESHOLD = 6;
const LEAVE_DURATION = 1.9;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mod = (value: number, span: number) => ((value % span) + span) % span;

const randomFood = (): FoodKind =>
  FOOD_KINDS[Math.floor(Math.random() * FOOD_KINDS.length)] ?? 'carrot';
const randomNeed = (): number => 1 + Math.floor(Math.random() * 4);

const randomKind = (exclude?: AnimalKind): AnimalKind => {
  const pool = exclude
    ? ANIMAL_KINDS.filter((kind) => kind !== exclude)
    : ANIMAL_KINDS;
  return pool[Math.floor(Math.random() * pool.length)] ?? 'bunny';
};

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    const temp = items[index] as T;
    items[index] = items[swap] as T;
    items[swap] = temp;
  }
  return items;
}

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
    const groundTop = this.height * 0.7;
    const kinds = shuffle([...ANIMAL_KINDS]).slice(0, 3);

    this.animals = [0, 1, 2].map((index) => ({
      kind: kinds[index] ?? randomKind(),
      x: this.width * (0.23 + index * 0.27),
      y: groundTop - size * 1.35,
      size,
      favorite: randomFood(),
      need: randomNeed(),
      fed: 0,
      chew: 0,
      joy: 0,
      bob: Math.random() * Math.PI * 2,
      bounce: 0,
      idle: 0,
      refuse: 0,
      leaveDelay: 0,
      leaveT: 0,
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

    const favorites = this.activeFavorites();
    const pool = favorites.length > 0 ? favorites : FOOD_KINDS;

    this.slots = Array.from({ length: 5 }, (_, index) => ({
      kind: pool[index % pool.length] ?? randomFood(),
      x: this.tray.x + this.tray.width * ((index + 0.5) / 5),
      y: this.tray.y + this.tray.height * 0.55,
      radius: slotRadius,
      bounce: 0,
    }));

    this.ensureTray();
    this.selected = null;
    this.flying = [];
  }

  private activeFavorites(): FoodKind[] {
    const favorites = new Set<FoodKind>();
    for (const animal of this.animals) {
      if (
        animal.leaveT === 0 &&
        animal.leaveDelay === 0 &&
        animal.fed < animal.need
      ) {
        favorites.add(animal.favorite);
      }
    }
    return [...favorites];
  }

  private randomActiveFavorite(): FoodKind {
    const favorites = this.activeFavorites();
    if (favorites.length === 0) {
      return this.slots[0]?.kind ?? randomFood();
    }
    return (
      favorites[Math.floor(Math.random() * favorites.length)] ?? randomFood()
    );
  }

  /** Guarantees that every product on the tray is wanted by someone. */
  private ensureTray(): void {
    const favorites = this.activeFavorites();
    if (favorites.length === 0) {
      return;
    }

    for (const slot of this.slots) {
      if (!favorites.includes(slot.kind)) {
        slot.kind =
          favorites[Math.floor(Math.random() * favorites.length)] ??
          slot.kind;
        slot.bounce = 1;
      }
    }

    for (const favorite of favorites) {
      if (this.slots.some((slot) => slot.kind === favorite)) {
        continue;
      }

      const counts = new Map<FoodKind, number>();
      for (const slot of this.slots) {
        counts.set(slot.kind, (counts.get(slot.kind) ?? 0) + 1);
      }
      let index = this.slots.findIndex(
        (slot) => (counts.get(slot.kind) ?? 0) > 1,
      );
      if (index === -1) {
        index = Math.floor(Math.random() * this.slots.length);
      }
      const slot = this.slots[index];
      if (slot) {
        slot.kind = favorite;
        slot.bounce = 1;
      }
    }

    if (this.selected !== null) {
      const slot = this.slots[this.selected];
      if (!slot || !favorites.includes(slot.kind)) {
        this.selected = null;
      }
    }
  }

  protected update(dt: number): void {
    this.time += dt;

    for (const animal of this.animals) {
      animal.chew = Math.max(0, animal.chew - dt * 1.4);
      animal.joy = Math.max(0, animal.joy - dt * 1.2);
      animal.bounce = Math.max(0, animal.bounce - dt * 2.5);
      animal.refuse = Math.max(0, animal.refuse - dt * 3);
      animal.bob += dt * 1.8;

      if (animal.leaveT > 0) {
        animal.leaveT += dt / LEAVE_DURATION;
        if (animal.leaveT >= 1) {
          this.respawnAnimal(animal);
        }
      } else if (animal.leaveDelay > 0) {
        animal.leaveDelay -= dt;
        if (animal.leaveDelay <= 0) {
          animal.leaveT = 0.0001;
          sound.chime(2);
          this.particles.burst(
            animal.x,
            animal.y + animal.size * 1.4,
            {
              count: 12,
              colors: ['#e8cba3', '#ffffff', '#ffd36e'],
              minSpeed: 30,
              maxSpeed: 120,
              life: 0.6,
              gravity: 240,
              size: 3,
            },
          );
        }
      } else {
        animal.idle += dt;
      }
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
      if (animal.leaveT === 0) {
        this.drawAnimal(ctx, animal);
      }
    }

    for (const animal of this.animals) {
      if (animal.leaveT > 0) {
        this.drawLeavingAnimal(ctx, animal);
      }
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
      if (
        !animal ||
        animal.leaveT > 0 ||
        animal.fed >= animal.need
      ) {
        continue;
      }

      const withinX = Math.abs(x - animal.x) < animal.size * 1.2;
      const withinY =
        y > animal.y - animal.size * 1.7 &&
        y < animal.y + animal.size * 1.8;

      if (!withinX || !withinY) {
        continue;
      }

      if (this.selected !== null) {
        this.feedAnimal(index, this.selected);
      } else {
        animal.bounce = 1;
        sound.chime(Math.floor(Math.random() * 5));
      }
      return;
    }

    this.selected = null;
  }

  private feedAnimal(animalIndex: number, slotIndex: number): void {
    const animal = this.animals[animalIndex];
    const slot = this.slots[slotIndex];
    if (!animal || !slot) {
      return;
    }
    if (
      animal.leaveT > 0 ||
      animal.fed >= animal.need ||
      this.flying.some((food) => food.animal === animalIndex)
    ) {
      return;
    }

    if (slot.kind !== animal.favorite) {
      animal.refuse = 1;
      animal.bounce = 1;
      sound.nope();
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

    slot.kind = this.randomActiveFavorite();
    slot.bounce = 1;
    this.ensureTray();
    this.selected = null;
    sound.pop(1.3);
  }

  private completeFeed(food: FlyingFood): void {
    const animal = this.animals[food.animal];
    if (!animal || animal.leaveT > 0 || animal.fed >= animal.need) {
      return;
    }

    animal.fed += 1;
    animal.chew = 1;
    animal.joy = 1;
    animal.idle = 0;

    this.treats += 1;
    this.hud?.setValue(this.treats);
    sound.munch();

    const satisfied = animal.fed >= animal.need;
    this.particles.hearts(
      animal.x,
      animal.y - animal.size * 0.4,
      satisfied ? 14 : 6,
    );

    if (satisfied) {
      sound.sparkle();
      animal.leaveDelay = 0.7;
      this.ensureTray();
    }
  }

  private respawnAnimal(animal: AnimalSlot): void {
    animal.kind = randomKind(animal.kind);
    animal.favorite = randomFood();
    animal.need = randomNeed();
    animal.fed = 0;
    animal.chew = 0;
    animal.joy = 0;
    animal.bounce = 1;
    animal.idle = 0;
    animal.refuse = 0;
    animal.leaveDelay = 0;
    animal.leaveT = 0;

    this.ensureTray();
    sound.chime(4);
    this.particles.burst(animal.x, animal.y, {
      count: 16,
      colors: ['#ffe36e', '#ff9ecb', '#ffffff', '#8fe3c8'],
      minSpeed: 40,
      maxSpeed: 170,
      life: 0.7,
      gravity: 160,
      size: 3.5,
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.72);
    sky.addColorStop(0, '#b8a6ff');
    sky.addColorStop(0.42, '#ffb3d9');
    sky.addColorStop(0.78, '#ffd9a8');
    sky.addColorStop(1, '#ffe9c9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.72);

    const sunX = width * 0.82;
    const sunY = height * 0.4;
    const sunR = Math.min(width, height) * 0.09;
    const glow = ctx.createRadialGradient(
      sunX,
      sunY,
      sunR * 0.4,
      sunX,
      sunY,
      sunR * 2.4,
    );
    glow.addColorStop(0, 'rgba(255, 220, 140, 0.65)');
    glow.addColorStop(1, 'rgba(255, 220, 140, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffdf8a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    for (let index = 0; index < 4; index++) {
      const span = width + 280;
      const x = mod(index * 210 + 30 + this.time * 6, span) - 140;
      const y = height * 0.1 + (index % 2) * height * 0.06;
      const size = Math.min(width, height) * 0.036;
      ctx.fillStyle = 'rgba(255, 238, 245, 0.9)';
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

    const horizon = height * 0.52;
    this.drawHills(ctx, 0.18, horizon, height * 0.045, '#c6ecc2');
    this.drawHills(
      ctx,
      0.36,
      horizon + height * 0.03,
      height * 0.035,
      '#a9e0a5',
    );

    const grass = ctx.createLinearGradient(0, horizon, 0, height);
    grass.addColorStop(0, '#b3e8a8');
    grass.addColorStop(0.5, '#86d97f');
    grass.addColorStop(1, '#58b766');
    ctx.fillStyle = grass;
    ctx.fillRect(0, horizon + height * 0.03, width, height);

    this.drawRoad(ctx);

    for (let index = 0; index < 7; index++) {
      const x = mod(index * 61 + this.time * 6, width + 80) - 40;
      const y = height * (0.73 + (index % 3) * 0.035);
      this.drawGrassTuft(ctx, x, y, index % 2 === 0);
    }
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    parallax: number,
    baseY: number,
    amplitude: number,
    color: string,
  ): void {
    const width = this.width;
    const wavelength = width * 1.1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let x = 0; x <= width + 8; x += 8) {
      const phase = ((x + this.time * parallax * 30) / wavelength) * Math.PI * 2;
      const y = baseY - Math.sin(phase) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, this.height);
    ctx.closePath();
    ctx.fill();
  }

  private drawRoad(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;
    const startX = -width * 0.05;
    const startY = height * 0.57;
    const ctrlX = width * 0.45;
    const ctrlY = height * 0.53;
    const endX = width * 0.96;
    const endY = height * 0.5;

    ctx.lineCap = 'round';

    ctx.strokeStyle = 'rgba(180, 145, 105, 0.32)';
    ctx.lineWidth = height * 0.072;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();

    ctx.strokeStyle = '#e8cba3';
    ctx.lineWidth = height * 0.055;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = Math.max(2, height * 0.004);
    ctx.setLineDash([height * 0.012, height * 0.018]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawGrassTuft(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    flower: boolean,
  ): void {
    if (flower) {
      ctx.fillStyle = '#fff4a8';
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(
          x + Math.cos(angle) * 3,
          y + Math.sin(angle) * 3,
          2.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = '#5cbb66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.quadraticCurveTo(x - 3, y, x - 6, y - 2);
    ctx.moveTo(x, y + 6);
    ctx.quadraticCurveTo(x + 3, y, x + 6, y - 2);
    ctx.stroke();
  }

  private drawBlanket(ctx: CanvasRenderingContext2D): void {
    const size =
      this.animals[0]?.size ?? Math.min(this.width, this.height) * 0.058;
    const cx = this.width / 2;
    const cy = this.height * 0.7 + size * 0.55;
    const rx = this.width * 0.44;
    const ry = this.height * 0.05;

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
    const dance = clamp((animal.idle - IDLE_THRESHOLD) / 1.2, 0, 1);
    const wiggle = Math.sin(this.time * 9) * dance * 0.09;
    const hop = Math.abs(Math.sin(this.time * 9)) * dance * animal.size * 0.16;
    const bounceLift = Math.sin(animal.bounce * Math.PI) * animal.size * 0.2;
    const chewLift =
      Math.abs(Math.sin(animal.chew * Math.PI * 2)) * animal.size * 0.14;
    const bob = Math.sin(animal.bob) * animal.size * 0.03;
    const refuseShake =
      Math.sin(animal.refuse * Math.PI * 10) * animal.size * 0.12 * animal.refuse;

    const x = animal.x + refuseShake;
    const y = animal.y - bounceLift - chewLift - hop + bob;
    const scale = 1 + animal.joy * 0.05;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wiggle);
    ctx.scale(scale, scale);
    drawSittingAnimal(ctx, animal.kind, animal.size, {
      expression:
        animal.chew > 0.05 || dance > 0.4 ? 'wink' : 'happy',
      blush: true,
    });
    ctx.restore();

    if (dance > 0.05) {
      this.drawDancePaws(ctx, animal, x, y, dance);
    }

    if (
      animal.leaveT === 0 &&
      animal.leaveDelay === 0 &&
      animal.fed < animal.need
    ) {
      this.drawThought(ctx, animal, x, y, dance);
    }
  }

  private drawDancePaws(
    ctx: CanvasRenderingContext2D,
    animal: AnimalSlot,
    x: number,
    y: number,
    dance: number,
  ): void {
    const color = animalBodyColor(animal.kind);
    const size = animal.size;

    ctx.save();
    ctx.globalAlpha = dance;

    for (const side of [-1, 1]) {
      const phase = this.time * 9 + (side === 1 ? 0 : Math.PI);
      const shoulderX = x + side * size * 0.62;
      const shoulderY = y + size * 1.05;
      const base = side === 1 ? -0.95 : -Math.PI + 0.95;
      const angle = base + Math.sin(phase) * 0.38;
      const armLength = size * 0.64;
      const pawX = shoulderX + Math.cos(angle) * armLength;
      const pawY = shoulderY + Math.sin(angle) * armLength;

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, size * 0.16);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(pawX, pawY);
      ctx.stroke();

      ctx.fillStyle = color;
      this.fillCircle(ctx, pawX, pawY, size * 0.17);
      ctx.fillStyle = 'rgba(255, 140, 185, 0.7)';
      this.fillCircle(ctx, pawX - size * 0.05, pawY - size * 0.05, size * 0.045);
      this.fillCircle(ctx, pawX + size * 0.04, pawY - size * 0.06, size * 0.04);
      this.fillCircle(ctx, pawX, pawY + size * 0.05, size * 0.045);
    }

    ctx.restore();
  }

  private drawThought(
    ctx: CanvasRenderingContext2D,
    animal: AnimalSlot,
    x: number,
    y: number,
    dance: number,
  ): void {
    const remaining = animal.need - animal.fed;
    if (remaining <= 0) {
      return;
    }

    const size = animal.size;
    const radius = size * 0.92;
    const bubbleX =
      x + Math.sin(this.time * 7) * dance * size * 0.05;
    const bubbleY =
      y - size * 1.85 + Math.sin(this.time * 9) * dance * size * 0.06;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.93)';
    for (const [dx, dy, scale] of [
      [0, 0, 1],
      [-0.62, 0.12, 0.42],
      [0.62, 0.12, 0.42],
    ] as const) {
      this.fillCircle(
        ctx,
        bubbleX + radius * dx,
        bubbleY + radius * dy,
        radius * scale,
      );
    }

    for (const [dx, dy, scale] of [
      [-0.45, 0.95, 0.16],
      [-0.3, 1.2, 0.1],
    ] as const) {
      this.fillCircle(
        ctx,
        bubbleX + radius * dx,
        bubbleY + radius * dy,
        radius * scale,
      );
    }

    ctx.save();
    ctx.translate(bubbleX, bubbleY - radius * 0.12);
    drawFood(ctx, animal.favorite, radius * 0.4);
    ctx.restore();

    const dotRadius = radius * 0.085;
    const gap = radius * 0.26;
    const total = (remaining - 1) * gap;
    ctx.fillStyle = '#ff8fbf';
    for (let index = 0; index < remaining; index++) {
      this.fillCircle(
        ctx,
        bubbleX - total / 2 + index * gap,
        bubbleY + radius * 0.44,
        dotRadius,
      );
    }
  }

  private drawLeavingAnimal(
    ctx: CanvasRenderingContext2D,
    animal: AnimalSlot,
  ): void {
    const t = Math.min(1, animal.leaveT);
    const one = 1 - t;

    const startX = animal.x;
    const startY = animal.y;
    const ctrlX = this.width * 0.55;
    const ctrlY = this.height * 0.48;
    const endX = this.width * 0.96;
    const endY = this.height * 0.5;

    const x =
      one * one * startX + 2 * one * t * ctrlX + t * t * endX;
    const y =
      one * one * startY + 2 * one * t * ctrlY + t * t * endY;
    const hop =
      Math.abs(Math.sin(t * Math.PI * 6)) * animal.size * 0.55 * (1 - t * 0.6);
    const scale = Math.max(0.18, 1 - t * 0.82);

    ctx.save();
    ctx.translate(x, y - hop);
    ctx.scale(scale, scale);
    drawSittingAnimal(ctx, animal.kind, animal.size, {
      expression: 'happy',
      blush: true,
    });
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
      ctx.translate(
        slot.x,
        slot.y - lift - (selected ? slot.radius * 0.12 : 0),
      );
      drawFood(ctx, slot.kind, slot.radius * 0.68);
      ctx.restore();
    }
  }

  private fillCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const feedGame: GameDefinition = {
  id: 'feed',
  title: 'Покорми зверят',
  icon: '🍎',
  colors: ['#ffc2dd', '#ff7fb6'],
  create: () => new FeedGame(),
};
