import { drawAnimalHead } from '../../art/characters';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import { createHud, type Hud } from '../../ui/hud';
import type { GameDefinition } from '../../types';

interface RoadObject {
  kind: 'star' | 'puddle';
  lane: number;
  x: number;
  spin: number;
  resolved: boolean;
}

const LANE_COUNT = 3;
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
  private scrollX = 0;
  private starTimer = 0.9;
  private puddleTimer = 1.9;

  private carLane = 1;
  private laneDirection = -1;
  private carX = 0;
  private carY = 0;
  private targetY = 0;
  private carW = 78;
  private carH = 43;
  private carBounce = 0;

  private roadTop = 0;
  private roadBottom = 0;
  private laneHeight = 0;

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
    this.roadTop = this.height * 0.6;
    this.roadBottom = this.height * 0.92;
    this.laneHeight = (this.roadBottom - this.roadTop) / LANE_COUNT;

    const side = Math.min(this.width, this.height);
    this.carW = Math.min(side * 0.2, this.width * 0.22);
    this.carH = this.carW * 0.55;
    this.carX = this.width * 0.28;

    this.carLane = clamp(this.carLane, 0, LANE_COUNT - 1);
    this.carY = this.laneCenter(this.carLane);
    this.targetY = this.carY;

    this.objects = [];
    this.starTimer = 0.9;
    this.puddleTimer = 1.9;
  }

  private laneCenter(lane: number): number {
    return this.roadTop + this.laneHeight * (lane + 0.5);
  }

  protected update(dt: number): void {
    this.time += dt;
    this.carBounce = Math.max(0, this.carBounce - dt * 3);

    const speed =
      Math.max(170, this.width * 0.45) *
      (1 + Math.min(this.time / 120, 0.5));
    this.scrollX = mod(this.scrollX + speed * dt, 600);
    this.carY = lerp(this.carY, this.targetY, Math.min(1, dt * 12));

    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.spawn('star');
      this.starTimer = 1 + Math.random() * 0.75;
    }

    this.puddleTimer -= dt;
    if (this.puddleTimer <= 0) {
      this.spawn('puddle');
      this.puddleTimer = 2.2 + Math.random() * 1.6;
    }

    const reach = this.carW * 0.45;

    for (const object of this.objects) {
      object.x -= speed * dt;
      object.spin += dt * 3;

      if (!object.resolved && object.x <= this.carX + reach) {
        object.resolved = true;
        if (object.lane === this.carLane) {
          this.hitObject(object);
        }
      }
    }

    this.objects = this.objects.filter((object) => object.x > -60);
    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawRoad(ctx);

    for (const object of this.objects) {
      if (object.kind === 'puddle') {
        this.drawPuddle(ctx, object);
      }
    }
    for (const object of this.objects) {
      if (object.kind === 'star') {
        this.drawStar(ctx, object);
      }
    }

    this.drawCar(ctx);
    this.particles.draw(ctx);
  }

  protected onTap(): void {
    let next = this.carLane + this.laneDirection;
    if (next < 0 || next >= LANE_COUNT) {
      this.laneDirection *= -1;
      next = this.carLane + this.laneDirection;
    }

    this.carLane = clamp(next, 0, LANE_COUNT - 1);
    this.targetY = this.laneCenter(this.carLane);
    sound.pop(1.7);
  }

  private spawn(kind: 'star' | 'puddle'): void {
    this.objects.push({
      kind,
      lane: Math.floor(Math.random() * LANE_COUNT),
      x: this.width + 40,
      spin: Math.random() * Math.PI * 2,
      resolved: false,
    });
  }

  private hitObject(object: RoadObject): void {
    const y = this.laneCenter(object.lane);

    if (object.kind === 'star') {
      this.collected += 1;
      this.hud?.setValue(this.collected);
      sound.collect();
      this.particles.burst(this.carX, y, {
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
    this.particles.burst(this.carX, y + this.carH * 0.25, {
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

    const sky = ctx.createLinearGradient(0, 0, 0, this.roadTop);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(0.6, '#ffe2f1');
    sky.addColorStop(1, '#fff0d9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, this.roadTop);

    const sunX = width * 0.8;
    const sunY = height * 0.12;
    const sunR = Math.min(width, height) * 0.065;
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
      const x = mod(index * 220 + 40 - this.time * 8, span) - 140;
      const y = height * 0.08 + (index % 2) * height * 0.05;
      const size = Math.min(width, height) * 0.034;
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

    this.drawHills(ctx, 0.24, this.roadTop - height * 0.015, height * 0.035, '#c6ecc2');
    this.drawHills(ctx, 0.45, this.roadTop, height * 0.028, '#a9e0a5');

    this.drawTrees(ctx);

    const grass = ctx.createLinearGradient(0, this.roadBottom, 0, height);
    grass.addColorStop(0, '#86d97f');
    grass.addColorStop(1, '#4aa95f');
    ctx.fillStyle = grass;
    ctx.fillRect(0, this.roadBottom, width, height - this.roadBottom);

    for (let index = 0; index < 7; index++) {
      const x = mod(index * 71 - this.scrollX * 0.9, width + 80) - 40;
      const y = this.roadBottom + height * (0.025 + (index % 2) * 0.03);
      this.drawGrassTuft(ctx, x, y, index % 3 === 0);
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
    const wavelength = width * 1.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, this.roadTop);
    for (let x = 0; x <= width + 8; x += 8) {
      const phase =
        ((x + this.scrollX * parallax) / wavelength) * Math.PI * 2;
      const y = baseY - Math.sin(phase) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, this.roadTop);
    ctx.closePath();
    ctx.fill();
  }

  private drawTrees(ctx: CanvasRenderingContext2D): void {
    const side = Math.min(this.width, this.height);
    const span = this.width + 200;

    for (let index = 0; index < 8; index++) {
      const x = mod(index * 170 - this.scrollX * 0.55, span) - 100;
      const scale = 0.72 + (index % 3) * 0.16;
      const trunkHeight = side * 0.045 * scale;
      const crown = side * 0.045 * scale;

      ctx.fillStyle = '#9a6b4a';
      ctx.fillRect(
        x - side * 0.006,
        this.roadTop - trunkHeight,
        side * 0.012,
        trunkHeight,
      );

      ctx.fillStyle = '#6fca70';
      ctx.beginPath();
      ctx.arc(x, this.roadTop - trunkHeight - crown * 0.35, crown, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8fdc8a';
      ctx.beginPath();
      ctx.arc(
        x - crown * 0.35,
        this.roadTop - trunkHeight - crown * 0.55,
        crown * 0.45,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  private drawRoad(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const road = ctx.createLinearGradient(0, this.roadTop, 0, this.roadBottom);
    road.addColorStop(0, '#7a7689');
    road.addColorStop(0.5, '#666274');
    road.addColorStop(1, '#575365');
    ctx.fillStyle = road;
    ctx.fillRect(0, this.roadTop, width, this.roadBottom - this.roadTop);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, this.roadTop, width, 3);
    ctx.fillRect(0, this.roadBottom - 3, width, 3);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([34, 26]);
    ctx.lineDashOffset = this.scrollX;

    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const y = this.roadTop + this.laneHeight * lane;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  private drawStar(ctx: CanvasRenderingContext2D, object: RoadObject): void {
    const size = Math.min(this.width, this.height) * 0.035;
    const y = this.laneCenter(object.lane);

    ctx.save();
    ctx.translate(object.x, y + Math.sin(object.spin) * 2);
    ctx.rotate(Math.sin(object.spin) * 0.2);
    ctx.shadowColor = 'rgba(255, 210, 60, 0.85)';
    ctx.shadowBlur = size * 1.1;
    ctx.fillStyle = '#ffd93b';
    drawStarPath(ctx, size);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff2a8';
    drawStarPath(ctx, size * 0.5);
    ctx.fill();
    ctx.restore();
  }

  private drawPuddle(
    ctx: CanvasRenderingContext2D,
    object: RoadObject,
  ): void {
    const rx = Math.min(this.width, this.height) * 0.07;
    const ry = this.laneHeight * 0.11;
    const y = this.laneCenter(object.lane) + this.laneHeight * 0.16;

    const liquid = ctx.createLinearGradient(
      object.x - rx,
      y,
      object.x + rx,
      y,
    );
    liquid.addColorStop(0, 'rgba(150, 205, 245, 0.8)');
    liquid.addColorStop(1, 'rgba(110, 175, 230, 0.85)');
    ctx.fillStyle = liquid;
    ctx.beginPath();
    ctx.ellipse(object.x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(
      object.x - rx * 0.3,
      y - ry * 0.25,
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
    const bob =
      Math.sin(this.time * 9) * 1.3 +
      Math.sin(this.carBounce * Math.PI) * h * 0.08;

    ctx.save();
    ctx.translate(this.carX, this.carY + bob);

    ctx.fillStyle = 'rgba(40, 30, 60, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.6, w * 0.56, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    const wheelR = h * 0.2;
    const wheelY = h * 0.36;
    for (const wx of [-w * 0.3, w * 0.3]) {
      ctx.save();
      ctx.translate(wx, wheelY);
      ctx.rotate(this.scrollX / (wheelR * 2));
      ctx.fillStyle = '#3d3548';
      ctx.beginPath();
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9c2d8';
      ctx.beginPath();
      ctx.arc(0, 0, wheelR * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7a7390';
      ctx.lineWidth = Math.max(1.2, wheelR * 0.12);
      ctx.beginPath();
      ctx.moveTo(-wheelR * 0.4, 0);
      ctx.lineTo(wheelR * 0.4, 0);
      ctx.moveTo(0, -wheelR * 0.4);
      ctx.lineTo(0, wheelR * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    const body = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
    body.addColorStop(0, '#ff9d72');
    body.addColorStop(1, '#f2704b');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h * 0.1, w, h * 0.55, h * 0.2);
    ctx.fill();

    ctx.fillStyle = '#ffb08a';
    ctx.beginPath();
    ctx.roundRect(-w * 0.32, -h * 0.5, w * 0.64, h * 0.52, h * 0.2);
    ctx.fill();

    ctx.fillStyle = '#d6f2ff';
    ctx.beginPath();
    ctx.roundRect(-w * 0.26, -h * 0.42, w * 0.22, h * 0.3, h * 0.08);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(w * 0.04, -h * 0.42, w * 0.22, h * 0.3, h * 0.08);
    ctx.fill();

    ctx.save();
    ctx.translate(w * 0.14, -h * 0.24);
    drawAnimalHead(ctx, 'bear', h * 0.15, {
      expression: 'happy',
      blush: true,
    });
    ctx.restore();

    ctx.fillStyle = '#fff4a8';
    ctx.beginPath();
    ctx.arc(w * 0.47, h * 0.14, h * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d95a3c';
    ctx.beginPath();
    ctx.roundRect(w * 0.44, h * 0.16, w * 0.07, h * 0.14, h * 0.03);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.3, h * 0.02, w * 0.16, h * 0.05, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
        ctx.arc(x + Math.cos(angle) * 3, y + Math.sin(angle) * 3, 2.4, 0, Math.PI * 2);
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

export const driveGame: GameDefinition = {
  id: 'drive',
  title: 'Покатушки',
  icon: '🚗',
  colors: ['#8fe3c8', '#2fb38a'],
  create: () => new DriveGame(),
};
