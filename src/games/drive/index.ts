import { drawAnimalHead } from '../../art/characters';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import { createHud, type Hud } from '../../ui/hud';
import type { GameDefinition } from '../../types';

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

interface Puddle {
  x: number;
  y: number;
  rx: number;
  ry: number;
  hit: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mod = (value: number, span: number) => ((value % span) + span) % span;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

class DriveGame extends CanvasGame {
  private particles = new Particles();
  private hud: Hud | null = null;

  private stars: Star[] = [];
  private puddles: Puddle[] = [];
  private collected = 0;

  private time = 0;
  private worldX = 0;
  private speed = 200;

  private carX = 0;
  private targetX = 0;
  private carY = 0;
  private carW = 70;
  private carH = 38;

  private starTimer = 0.7;
  private puddleTimer = 1.6;

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
    const side = Math.min(this.width, this.height);
    const roadTop = this.height * 0.72;
    const roadBottom = this.height * 0.93;

    this.carW = side * 0.2;
    this.carH = this.carW * 0.55;
    this.carY = roadTop + (roadBottom - roadTop) * 0.62;
    this.carX = clamp(this.carX || this.width / 2, this.carW * 0.5 + 8, this.width - this.carW * 0.5 - 8);
    this.targetX = this.carX;

    this.stars = [];
    this.puddles = [];
  }

  protected update(dt: number): void {
    this.time += dt;
    this.speed =
      Math.max(200, this.width * 0.5) *
      (1 + Math.min(this.time / 120, 0.45));
    this.worldX += this.speed * dt;

    this.carX = lerp(this.carX, this.targetX, Math.min(1, dt * 7));

    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.spawnStars();
      this.starTimer = 1.1 + Math.random() * 1.1;
    }

    this.puddleTimer -= dt;
    if (this.puddleTimer <= 0) {
      this.spawnPuddle();
      this.puddleTimer = 2 + Math.random() * 1.6;
    }

    for (const star of this.stars) {
      star.x -= this.speed * dt;
      star.phase += dt * 4;
    }
    for (const puddle of this.puddles) {
      puddle.x -= this.speed * dt;
    }

    const carCenterX = this.carX;
    const carCenterY = this.carY - this.carH * 0.5;
    const carReach = this.carW * 0.6;

    this.stars = this.stars.filter((star) => {
      if (star.x + star.size < -20) {
        return false;
      }
      const dx = star.x - carCenterX;
      const dy = star.y - carCenterY;
      const reach = carReach + star.size;
      if (dx * dx + dy * dy <= reach * reach) {
        this.collectStar(star);
        return false;
      }
      return true;
    });

    for (const puddle of this.puddles) {
      if (puddle.hit) {
        continue;
      }
      const dx = Math.abs(puddle.x - carCenterX);
      const dy = Math.abs(puddle.y - this.carY);
      if (dx < puddle.rx + carReach && dy < puddle.ry + this.carH * 0.3) {
        puddle.hit = true;
        sound.splash();
        this.particles.burst(puddle.x, puddle.y, {
          count: 14,
          colors: ['#cdeaff', '#ffffff', '#9fd3ff'],
          minSpeed: 50,
          maxSpeed: 180,
          life: 0.5,
          gravity: 500,
          size: 3,
        });
      }
    }

    this.puddles = this.puddles.filter((puddle) => puddle.x + puddle.rx > -30);

    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawRoad(ctx);

    for (const puddle of this.puddles) {
      this.drawPuddle(ctx, puddle);
    }
    for (const star of this.stars) {
      this.drawStar(ctx, star);
    }

    this.drawCar(ctx);
    this.particles.draw(ctx);
  }

  protected onTap(x: number): void {
    const margin = this.carW * 0.5 + 8;
    this.targetX = clamp(x, margin, this.width - margin);
  }

  private spawnStars(): void {
    const count = Math.random() < 0.35 ? 3 : 1;
    const baseY = this.carY - this.carH * 0.5 + (Math.random() - 0.5) * this.carH * 0.7;

    for (let index = 0; index < count; index++) {
      this.stars.push({
        x: this.width + 30 + index * this.carW * 0.6,
        y: baseY + (Math.random() - 0.5) * this.carH * 0.35,
        size: Math.min(this.width, this.height) * 0.028,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private spawnPuddle(): void {
    const rx = this.carW * (0.22 + Math.random() * 0.16);
    this.puddles.push({
      x: this.width + rx + 10,
      y: this.carY + this.carH * 0.1,
      rx,
      ry: this.carH * 0.11,
      hit: false,
    });
  }

  private collectStar(star: Star): void {
    this.collected += 1;
    this.hud?.setValue(this.collected);
    sound.collect();
    this.particles.burst(star.x, star.y, {
      count: 10,
      colors: ['#ffe36e', '#fff4a8', '#ffffff', '#ffd93b'],
      minSpeed: 40,
      maxSpeed: 170,
      life: 0.55,
      gravity: 120,
      size: 3.5,
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.72);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(0.55, '#ffe2f1');
    sky.addColorStop(1, '#fff2de');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.72);

    const sunX = width * 0.8;
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

    for (let index = 0; index < 4; index++) {
      const span = width + 300;
      const x = mod(index * 230 + 40 - this.worldX * 0.12, span) - 150;
      const y = height * 0.1 + (index % 2) * height * 0.07;
      const size = Math.min(width, height) * 0.04;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      for (const [dx, dy, scale] of [
        [0, 0, 1],
        [0.85, 0.1, 0.78],
        [-0.85, 0.13, 0.68],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + size * dx, y + size * dy, size * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const hillY = height * 0.64;
    this.drawHills(ctx, 0.22, hillY, height * 0.05, '#c6ecc2');
    this.drawHills(ctx, 0.42, hillY + height * 0.03, height * 0.04, '#a9e0a5');

    const grass = ctx.createLinearGradient(0, hillY, 0, height * 0.72);
    grass.addColorStop(0, '#9fe08f');
    grass.addColorStop(1, '#7fd47f');
    ctx.fillStyle = grass;
    ctx.fillRect(0, hillY + height * 0.04, width, height);

    this.drawTrees(ctx, hillY + height * 0.03);
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
      const phase = ((x + this.worldX * parallax) / wavelength) * Math.PI * 2;
      const y = baseY - Math.sin(phase) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, this.height);
    ctx.closePath();
    ctx.fill();
  }

  private drawTrees(ctx: CanvasRenderingContext2D, baseY: number): void {
    const side = Math.min(this.width, this.height);
    const span = this.width + 240;

    for (let index = 0; index < 8; index++) {
      const x = mod(index * 180 - this.worldX * 0.55, span) - 120;
      const scale = 0.7 + (index % 3) * 0.18;
      const trunkH = side * 0.045 * scale;
      const crownR = side * 0.045 * scale;

      ctx.fillStyle = '#9a6b4a';
      ctx.fillRect(x - side * 0.006, baseY - trunkH, side * 0.012, trunkH);

      ctx.fillStyle = '#6fca70';
      ctx.beginPath();
      ctx.arc(x, baseY - trunkH - crownR * 0.35, crownR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8fdc8a';
      ctx.beginPath();
      ctx.arc(x - crownR * 0.35, baseY - trunkH - crownR * 0.55, crownR * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawRoad(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;
    const roadTop = height * 0.72;
    const roadBottom = height * 0.93;

    const road = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    road.addColorStop(0, '#7a7689');
    road.addColorStop(0.5, '#666274');
    road.addColorStop(1, '#575365');
    ctx.fillStyle = road;
    ctx.fillRect(0, roadTop, width, roadBottom - roadTop);

    ctx.fillStyle = '#8a869c';
    ctx.fillRect(0, roadTop, width, 3);
    ctx.fillStyle = '#4a4658';
    ctx.fillRect(0, roadBottom - 3, width, 3);

    const mid = (roadTop + roadBottom) / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    for (let index = 0; index < Math.ceil(width / 90) + 2; index++) {
      const x = mod(index * 90 - this.worldX, width + 90) - 60;
      ctx.beginPath();
      ctx.roundRect(x, mid - 3, 46, 6, 3);
      ctx.fill();
    }

    const bottomGrass = ctx.createLinearGradient(0, roadBottom, 0, height);
    bottomGrass.addColorStop(0, '#7fd47f');
    bottomGrass.addColorStop(1, '#4aa95f');
    ctx.fillStyle = bottomGrass;
    ctx.fillRect(0, roadBottom, width, height - roadBottom);
  }

  private drawPuddle(ctx: CanvasRenderingContext2D, puddle: Puddle): void {
    const grad = ctx.createLinearGradient(
      puddle.x - puddle.rx,
      puddle.y,
      puddle.x + puddle.rx,
      puddle.y,
    );
    grad.addColorStop(0, 'rgba(150, 205, 245, 0.75)');
    grad.addColorStop(1, 'rgba(110, 175, 230, 0.8)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, puddle.rx, puddle.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(
      puddle.x - puddle.rx * 0.3,
      puddle.y - puddle.ry * 0.25,
      puddle.rx * 0.3,
      puddle.ry * 0.22,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  private drawStar(ctx: CanvasRenderingContext2D, star: Star): void {
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(Math.sin(star.phase) * 0.25);
    ctx.shadowColor = 'rgba(255, 210, 60, 0.9)';
    ctx.shadowBlur = star.size * 1.2;
    ctx.fillStyle = '#ffd93b';
    drawStarPath(ctx, star.size);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff2a8';
    drawStarPath(ctx, star.size * 0.5);
    ctx.fill();
    ctx.restore();
  }

  private drawCar(ctx: CanvasRenderingContext2D): void {
    const w = this.carW;
    const h = this.carH;
    const steer = clamp((this.targetX - this.carX) / (w * 0.8), -1, 1);
    const bob = Math.sin(this.time * 9) * 1.4;

    ctx.save();
    ctx.translate(this.carX, this.carY - h * 0.5 + bob);
    ctx.rotate(steer * 0.07);

    ctx.fillStyle = 'rgba(40, 30, 60, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.6, w * 0.56, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    const wheelR = h * 0.2;
    const wheelY = h * 0.42;
    for (const wx of [-w * 0.3, w * 0.3]) {
      ctx.save();
      ctx.translate(wx, wheelY);
      ctx.rotate(this.worldX / (wheelR * 2));
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
    drawAnimalHead(ctx, 'bear', h * 0.16, {
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
