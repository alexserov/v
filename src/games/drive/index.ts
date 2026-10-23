import { drawAnimalHead } from '../../art/characters';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import { createHud, type Hud } from '../../ui/hud';
import type { GameDefinition } from '../../types';

interface RoadObject {
  kind: 'star' | 'puddle';
  lane: number;
  z: number;
  spin: number;
  resolved: boolean;
}

const CAR_Z = 0.78;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mod = (value: number, span: number) => ((value % span) + span) % span;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

class DriveGame extends CanvasGame {
  private hud: Hud | null = null;
  private particles = new Particles();
  private objects: RoadObject[] = [];

  private collected = 0;
  private time = 0;
  private scroll = 0;
  private starTimer = 0.7;
  private puddleTimer = 1.8;

  private carLane = 0;
  private targetLane = 0;
  private carBounce = 0;

  private side = 0;
  private horizonY = 0;
  private centerX = 0;
  private topHalf = 0;
  private bottomHalf = 0;
  private carW = 80;
  private carH = 56;
  private carX = 0;
  private carY = 0;

  protected onMount(): void {
    if (!this.host) {
      return;
    }
    this.hud = createHud(this.host, { icon: '⭐', initial: 0 });
  }

  protected onDestroy(): void {
    this.hud?.destroy();
    this.hud = null;
  }

  protected onResize(): void {
    this.side = Math.min(this.width, this.height);
    this.horizonY = this.height * 0.26;
    this.centerX = this.width / 2;
    this.topHalf = this.width * 0.08;
    this.bottomHalf = this.width * 0.42;

    this.carW = Math.min(this.width * 0.24, this.height * 0.12);
    this.carH = this.carW * 0.7;

    const car = this.project(CAR_Z, 0);
    this.carY = car.y;

    const maxLane = this.maxLane();
    this.carLane = clamp(this.carLane, -maxLane, maxLane);
    this.targetLane = clamp(this.targetLane, -maxLane, maxLane);
    this.carX = this.centerX + this.carLane * car.half;

    this.objects = [];
    this.starTimer = 0.7;
    this.puddleTimer = 1.8;
  }

  private project(z: number, lane: number) {
    const t = clamp(z, 0, 1.1);
    const half = this.topHalf + (this.bottomHalf - this.topHalf) * t;
    return {
      x: this.centerX + lane * half,
      y: this.horizonY + (this.height - this.horizonY) * t,
      half,
      scale: 0.35 + 0.65 * t,
    };
  }

  private maxLane(): number {
    const half = this.project(CAR_Z, 0).half;
    return Math.max(
      0.2,
      1 - (this.carW * 0.5 + this.side * 0.025) / Math.max(1, half),
    );
  }

  protected update(dt: number): void {
    this.time += dt;
    this.carBounce = Math.max(0, this.carBounce - dt * 3);

    const zSpeed = 0.34 * (1 + Math.min(this.time / 120, 0.5));
    this.scroll = mod(this.scroll + zSpeed * dt, 1);

    const maxLane = this.maxLane();
    this.targetLane = clamp(this.targetLane, -maxLane, maxLane);
    this.carLane = lerp(this.carLane, this.targetLane, Math.min(1, dt * 8));

    const car = this.project(CAR_Z, this.carLane);
    this.carX = car.x;
    this.carY = car.y;

    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.spawn('star');
      this.starTimer = 0.95 + Math.random() * 0.75;
    }

    this.puddleTimer -= dt;
    if (this.puddleTimer <= 0) {
      this.spawn('puddle');
      this.puddleTimer = 2.2 + Math.random() * 1.6;
    }

    for (const object of this.objects) {
      object.z += zSpeed * dt;
      object.spin += dt * 3;

      if (!object.resolved && object.z >= CAR_Z) {
        object.resolved = true;
        if (Math.abs(object.lane - this.carLane) < 0.34) {
          this.hitObject(object);
        }
      }
    }

    this.objects = this.objects.filter((object) => object.z < 1.15);
    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawRoad(ctx);

    const sorted = [...this.objects].sort((a, b) => a.z - b.z);
    for (const object of sorted) {
      if (object.z < CAR_Z) {
        this.drawObject(ctx, object);
      }
    }

    this.drawCar(ctx);

    for (const object of sorted) {
      if (object.z >= CAR_Z) {
        this.drawObject(ctx, object);
      }
    }

    this.particles.draw(ctx);
  }

  protected onTap(x: number, y: number): void {
    const t = clamp(
      (y - this.horizonY) / Math.max(1, this.height - this.horizonY),
      0,
      1,
    );
    const half = this.topHalf + (this.bottomHalf - this.topHalf) * t;
    const lane = (x - this.centerX) / Math.max(1, half);
    const maxLane = this.maxLane();
    this.targetLane = clamp(lane, -maxLane, maxLane);
  }

  private spawn(kind: 'star' | 'puddle'): void {
    const maxLane = Math.max(0.25, this.maxLane() * 0.9);
    const lane = (Math.random() * 2 - 1) * maxLane;

    this.objects.push({
      kind,
      lane,
      z: 0,
      spin: Math.random() * Math.PI * 2,
      resolved: false,
    });
  }

  private hitObject(object: RoadObject): void {
    const point = this.project(object.z, object.lane);

    if (object.kind === 'star') {
      this.collected += 1;
      this.hud?.setValue(this.collected);
      sound.collect();
      this.particles.burst(point.x, point.y, {
        count: 11,
        colors: ['#ffe36e', '#fff4a8', '#ffffff', '#ffd93b'],
        minSpeed: 40,
        maxSpeed: 180,
        life: 0.55,
        gravity: 120,
        size: 3.5,
      });
      return;
    }

    this.carBounce = 1;
    sound.splash();
    this.particles.burst(point.x, point.y, {
      count: 14,
      colors: ['#cdeaff', '#ffffff', '#9fd3ff'],
      minSpeed: 50,
      maxSpeed: 190,
      life: 0.5,
      gravity: 420,
      size: 3,
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, this.horizonY);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(0.7, '#ffe2f1');
    sky.addColorStop(1, '#fff0d9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, this.horizonY + 2);

    const sunX = width * 0.8;
    const sunY = height * 0.11;
    const sunR = this.side * 0.065;
    const glow = ctx.createRadialGradient(
      sunX,
      sunY,
      sunR * 0.4,
      sunX,
      sunY,
      sunR * 2,
    );
    glow.addColorStop(0, 'rgba(255, 235, 130, 0.6)');
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
      const span = width + 260;
      const x = mod(index * 220 + 40 + this.time * 5, span) - 130;
      const y = height * 0.07 + (index % 2) * height * 0.05;
      const size = this.side * 0.032;
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

    const grass = ctx.createLinearGradient(0, this.horizonY, 0, height);
    grass.addColorStop(0, '#b3e8a8');
    grass.addColorStop(0.45, '#8fdc8a');
    grass.addColorStop(1, '#58b766');
    ctx.fillStyle = grass;
    ctx.fillRect(0, this.horizonY, width, height - this.horizonY);

    ctx.fillStyle = '#c6ecc2';
    ctx.beginPath();
    ctx.moveTo(0, this.horizonY + height * 0.02);
    for (let x = 0; x <= width + 8; x += 8) {
      const phase = (x / (width * 1.2)) * Math.PI * 2;
      const y = this.horizonY - Math.sin(phase) * height * 0.025;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, this.horizonY + height * 0.02);
    ctx.closePath();
    ctx.fill();

    this.drawSideScenery(ctx);
  }

  private drawSideScenery(ctx: CanvasRenderingContext2D): void {
    for (let index = 0; index < 7; index++) {
      const z = mod(index / 7 + this.scroll * 0.6, 1);
      if (z < 0.03 || z > 0.98) {
        continue;
      }

      const point = this.project(z, 0);
      const size = this.side * (0.01 + z * 0.035);
      const offset = this.side * 0.055 + size * 0.8;
      const leftX = this.centerX - point.half - offset;
      const rightX = this.centerX + point.half + offset;

      drawTree(ctx, leftX, point.y, size);
      drawTree(ctx, rightX, point.y, size);
    }

    for (let index = 0; index < 5; index++) {
      const z = mod(index / 5 + this.scroll * 0.6 + 0.12, 1);
      if (z < 0.05 || z > 0.9) {
        continue;
      }

      const point = this.project(z, 0);
      const size = this.side * (0.004 + z * 0.012);
      const offset = this.side * 0.03;
      drawFlower(ctx, this.centerX - point.half - offset, point.y, size);
      drawFlower(ctx, this.centerX + point.half + offset, point.y, size);
    }
  }

  private drawRoad(ctx: CanvasRenderingContext2D): void {
    const height = this.height;

    const road = ctx.createLinearGradient(0, this.horizonY, 0, height);
    road.addColorStop(0, '#8a869c');
    road.addColorStop(0.4, '#6f6b80');
    road.addColorStop(1, '#575365');
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(this.centerX - this.topHalf, this.horizonY);
    ctx.lineTo(this.centerX + this.topHalf, this.horizonY);
    ctx.lineTo(this.centerX + this.bottomHalf, height);
    ctx.lineTo(this.centerX - this.bottomHalf, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(2, this.side * 0.006);
    ctx.beginPath();
    ctx.moveTo(this.centerX - this.topHalf, this.horizonY);
    ctx.lineTo(this.centerX - this.bottomHalf, height);
    ctx.moveTo(this.centerX + this.topHalf, this.horizonY);
    ctx.lineTo(this.centerX + this.bottomHalf, height);
    ctx.stroke();

    for (let index = 0; index < 9; index++) {
      const z = mod(index / 9 + this.scroll, 1);
      if (z < 0.03) {
        continue;
      }
      const point = this.project(z, 0);
      const dashWidth = 2 + point.scale * 4;
      const dashHeight = 6 + point.scale * 18;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.roundRect(
        point.x - dashWidth / 2,
        point.y - dashHeight / 2,
        dashWidth,
        dashHeight,
        dashWidth / 2,
      );
      ctx.fill();
    }
  }

  private drawObject(
    ctx: CanvasRenderingContext2D,
    object: RoadObject,
  ): void {
    const point = this.project(object.z, object.lane);

    if (object.kind === 'star') {
      const size = this.side * 0.05 * point.scale;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(Math.sin(object.spin) * 0.2);
      ctx.shadowColor = 'rgba(255, 210, 60, 0.9)';
      ctx.shadowBlur = size * 1.2;
      ctx.fillStyle = '#ffd93b';
      drawStarPath(ctx, size);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff2a8';
      drawStarPath(ctx, size * 0.5);
      ctx.fill();
      ctx.restore();
      return;
    }

    const rx = this.side * 0.08 * point.scale;
    const ry = rx * 0.4;
    const liquid = ctx.createLinearGradient(-rx, 0, rx, 0);
    liquid.addColorStop(0, 'rgba(150, 205, 245, 0.8)');
    liquid.addColorStop(1, 'rgba(110, 175, 230, 0.85)');
    ctx.fillStyle = liquid;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(
      point.x - rx * 0.3,
      point.y - ry * 0.25,
      rx * 0.3,
      ry * 0.22,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  private drawCar(ctx: CanvasRenderingContext2D): void {
    const w = this.carW;
    const h = this.carH;
    const steer = clamp((this.targetLane - this.carLane) * 2.2, -1, 1);
    const bounce = Math.sin(this.carBounce * Math.PI) * h * 0.08;
    const wobble = Math.sin(this.time * 10) * 1.2;

    ctx.save();
    ctx.translate(this.carX, this.carY - bounce + wobble);
    ctx.rotate(steer * 0.08);

    ctx.fillStyle = 'rgba(40, 30, 60, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.52, w * 0.56, h * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d3548';
    ctx.beginPath();
    ctx.roundRect(-w * 0.55, h * 0.18, w * 0.17, h * 0.32, h * 0.08);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(w * 0.38, h * 0.18, w * 0.17, h * 0.32, h * 0.08);
    ctx.fill();

    const body = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
    body.addColorStop(0, '#ff9d72');
    body.addColorStop(1, '#f2704b');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h * 0.5, w, h, h * 0.22);
    ctx.fill();

    ctx.fillStyle = '#d6f2ff';
    ctx.beginPath();
    ctx.roundRect(-w * 0.3, -h * 0.44, w * 0.6, h * 0.34, h * 0.1);
    ctx.fill();

    ctx.save();
    ctx.translate(0, -h * 0.27);
    drawAnimalHead(ctx, 'bear', h * 0.13, {
      expression: 'happy',
      blush: true,
    });
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-w * 0.26, -h * 0.4, w * 0.2, h * 0.08, h * 0.04);
    ctx.fill();

    ctx.fillStyle = '#ff5a5a';
    ctx.beginPath();
    ctx.arc(-w * 0.32, h * 0.2, h * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.32, h * 0.2, h * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb08a';
    ctx.beginPath();
    ctx.roundRect(-w * 0.46, h * 0.3, w * 0.92, h * 0.12, h * 0.05);
    ctx.fill();

    ctx.fillStyle = '#fff4a8';
    ctx.beginPath();
    ctx.roundRect(-w * 0.12, h * 0.31, w * 0.24, h * 0.09, h * 0.03);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-w * 0.42, -h * 0.48, w * 0.84, h * 0.06, h * 0.03);
    ctx.fill();

    ctx.restore();
  }
}

function drawStarPath(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  for (let index = 0; index < 10; index++) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? size : size * 0.45;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.fillStyle = '#9a6b4a';
  ctx.fillRect(x - size * 0.12, y - size * 2.2, size * 0.24, size * 2.2);

  ctx.fillStyle = '#6fca70';
  ctx.beginPath();
  ctx.arc(x, y - size * 2.6, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - size * 0.62, y - size * 2.1, size * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + size * 0.62, y - size * 2.1, size * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8fdc8a';
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 2.85, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.fillStyle = '#fff4a8';
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(angle) * size * 2,
      y + Math.sin(angle) * size * 2,
      size * 1.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export const driveGame: GameDefinition = {
  id: 'drive',
  title: 'Покатушки',
  icon: '🚗',
  colors: ['#8fe3c8', '#2fb38a'],
  create: () => new DriveGame(),
};
