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
  remove?: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
}

const LANE_COUNT = 3;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mod = (value: number, span: number) => ((value % span) + span) % span;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const WEATHER_TARGETS = [
  { clouds: 0.18, rain: 0 },
  { clouds: 0.9, rain: 0 },
  { clouds: 1, rain: 1 },
] as const;

const SKY_DAY = [
  [191, 230, 255],
  [255, 226, 241],
  [255, 240, 217],
] as const;
const SKY_SUNSET = [
  [111, 125, 205],
  [255, 150, 170],
  [255, 196, 110],
] as const;
const SKY_NIGHT = [
  [16, 22, 52],
  [30, 31, 72],
  [52, 42, 88],
] as const;
const SUN_DAY = [255, 227, 110] as const;
const SUN_SET = [255, 159, 67] as const;
const CLOUD_WHITE = [255, 255, 255] as const;
const CLOUD_GRAY = [198, 208, 222] as const;

function mixColor(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  amount: number,
): string {
  const t = clamp(amount, 0, 1);
  return `rgb(${Math.round(from[0] + (to[0] - from[0]) * t)}, ${Math.round(
    from[1] + (to[1] - from[1]) * t,
  )}, ${Math.round(from[2] + (to[2] - from[2]) * t)})`;
}

function skyColor(night: number, index: 0 | 1 | 2): string {
  if (night < 0.5) {
    return mixColor(SKY_DAY[index], SKY_SUNSET[index], night / 0.5);
  }
  return mixColor(SKY_SUNSET[index], SKY_NIGHT[index], (night - 0.5) / 0.5);
}

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

  private dayPhase = 0;
  private readonly skyStars = Array.from({ length: 26 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.6 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
  }));

  private weatherIndex = 0;
  private weatherTimer = 18;
  private cloudsAmount = 0.18;
  private rainAmount = 0;
  private rainbow = 0;
  private rainDrops: RainDrop[] = [];

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
    this.rainDrops = [];
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
    this.scrollX += speed * dt;
    this.dayPhase = (this.dayPhase + dt / 70) % 1;
    this.carY = lerp(this.carY, this.targetY, Math.min(1, dt * 12));

    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherIndex = (this.weatherIndex + 1) % WEATHER_TARGETS.length;
      this.weatherTimer = 20;
      if (this.weatherIndex === 0) {
        this.rainbow = 1;
      }
    }

    const weather = WEATHER_TARGETS[this.weatherIndex] ?? WEATHER_TARGETS[0];
    this.cloudsAmount = lerp(
      this.cloudsAmount,
      weather.clouds,
      Math.min(1, dt * 0.5),
    );
    this.rainAmount = lerp(
      this.rainAmount,
      weather.rain,
      Math.min(1, dt * 0.6),
    );
    if (this.rainbow > 0) {
      this.rainbow = Math.max(0, this.rainbow - dt / 8);
    }

    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.spawn('star');
      this.starTimer = 1 + Math.random() * 0.75;
    }

    this.puddleTimer -= dt;
    if (this.puddleTimer <= 0) {
      this.spawn('puddle');
      this.puddleTimer =
        (2.2 + Math.random() * 1.6) * (1.15 - this.rainAmount * 0.45);
    }

    if (this.rainAmount > 0.02) {
      if (this.rainDrops.length === 0) {
        this.rainDrops = Array.from({ length: 64 }, () =>
          this.makeRainDrop(true),
        );
      }
      for (const drop of this.rainDrops) {
        drop.y += drop.speed * dt;
        drop.x -= 42 * dt;
        if (drop.y > this.height + 24 || drop.x < -30) {
          const fresh = this.makeRainDrop(false);
          drop.x = fresh.x;
          drop.y = fresh.y;
          drop.speed = fresh.speed;
          drop.length = fresh.length;
          drop.alpha = fresh.alpha;
        }
      }
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

    this.objects = this.objects.filter(
      (object) => !object.remove && object.x > -60,
    );
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

    this.drawCar(ctx);

    this.drawWeatherTint(ctx);
    this.drawNightOverlay(ctx);
    this.drawRainbow(ctx);
    this.drawSkyNight(ctx);
    this.drawHeadlights(ctx);

    for (const object of this.objects) {
      if (object.kind === 'star' && !object.remove) {
        this.drawStar(ctx, object);
      }
    }

    this.drawRain(ctx);
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
      object.remove = true;
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

  private nightAmount(): number {
    return 0.5 - 0.5 * Math.cos(this.dayPhase * Math.PI * 2);
  }

  private sunHeight(): number {
    return 0.5 + 0.5 * Math.cos(this.dayPhase * Math.PI * 2);
  }

  private makeRainDrop(randomY: boolean): RainDrop {
    return {
      x: Math.random() * (this.width + 50),
      y: randomY
        ? Math.random() * this.height
        : -20 - Math.random() * this.height * 0.3,
      speed: 480 + Math.random() * 280,
      length: 10 + Math.random() * 12,
      alpha: 0.22 + Math.random() * 0.33,
    };
  }

  private drawCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    alpha: number,
  ): void {
    if (alpha < 0.01) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (const [dx, dy, scale] of [
      [0, 0, 1],
      [0.85, 0.1, 0.78],
      [-0.85, 0.13, 0.68],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x + size * dx, y + size * dy, size * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWeatherTint(ctx: CanvasRenderingContext2D): void {
    const amount = this.cloudsAmount * 0.1 + this.rainAmount * 0.12;
    if (amount < 0.01) {
      return;
    }
    ctx.fillStyle = `rgba(105, 125, 150, ${amount})`;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawNightOverlay(ctx: CanvasRenderingContext2D): void {
    const night = this.nightAmount();
    if (night < 0.02) {
      return;
    }
    const tint = ctx.createLinearGradient(0, 0, 0, this.height);
    tint.addColorStop(0, `rgba(12, 16, 42, ${night * 0.16})`);
    tint.addColorStop(0.55, `rgba(12, 16, 42, ${night * 0.3})`);
    tint.addColorStop(1, `rgba(12, 16, 42, ${night * 0.46})`);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawRainbow(ctx: CanvasRenderingContext2D): void {
    if (this.rainbow < 0.02) {
      return;
    }
    const night = this.nightAmount();
    if (night > 0.55) {
      return;
    }

    const centerX = this.width / 2;
    const centerY = this.roadTop + this.height * 0.04;
    const baseRadius = this.width * 0.42;
    const colors = [
      '#ff8f8f',
      '#ffc46e',
      '#fff4a8',
      '#a8e6a1',
      '#9fd3ff',
      '#c3a6ff',
    ];
    const lineWidth = Math.max(4, this.height * 0.008);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.roadTop);
    ctx.clip();
    ctx.globalAlpha = this.rainbow * 0.32 * (1 - night * 0.5);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    colors.forEach((color, index) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        baseRadius - index * lineWidth * 1.2,
        Math.PI,
        Math.PI * 2,
      );
      ctx.stroke();
    });
    ctx.restore();
  }

  private drawSkyNight(ctx: CanvasRenderingContext2D): void {
    const night = this.nightAmount();
    if (night < 0.02) {
      return;
    }

    const width = this.width;
    const height = this.height;
    const weatherClear = clamp(1 - this.cloudsAmount * 0.85, 0, 1);

    for (const star of this.skyStars) {
      const twinkle = 0.55 + 0.45 * Math.sin(this.time * 2 + star.phase);
      ctx.fillStyle = `rgba(255, 255, 235, ${
        night * twinkle * 0.9 * weatherClear
      })`;
      ctx.beginPath();
      ctx.arc(
        star.x * width,
        this.roadTop * (0.06 + star.y * 0.72),
        star.size,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const moonAlpha =
      clamp(night * 1.15 - 0.1, 0, 1) *
      clamp(
        1 - this.cloudsAmount * 0.55 - this.rainAmount * 0.15,
        0,
        1,
      );
    if (moonAlpha < 0.02) {
      return;
    }

    const moonHeight = 1 - this.sunHeight();
    const mx = width * 0.22;
    const my = lerp(
      this.roadTop - height * 0.02,
      height * 0.1,
      moonHeight,
    );
    const mr = Math.min(width, height) * 0.05;

    ctx.save();
    ctx.globalAlpha = moonAlpha;

    const glow = ctx.createRadialGradient(
      mx,
      my,
      mr * 0.5,
      mx,
      my,
      mr * 2.6,
    );
    glow.addColorStop(0, 'rgba(255, 250, 210, 0.5)');
    glow.addColorStop(1, 'rgba(255, 250, 210, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(230, 220, 180, 0.55)';
    for (const [dx, dy, r] of [
      [-0.35, -0.2, 0.16],
      [0.3, 0.15, 0.12],
      [0.05, -0.42, 0.09],
      [-0.2, 0.38, 0.1],
    ] as const) {
      ctx.beginPath();
      ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(120, 105, 80, 0.65)';
    ctx.lineWidth = Math.max(1.2, mr * 0.07);
    ctx.lineCap = 'round';
    for (const sx of [-0.3, 0.3]) {
      ctx.beginPath();
      ctx.arc(
        mx + sx * mr,
        my - 0.02 * mr,
        mr * 0.12,
        Math.PI * 1.15,
        Math.PI * 1.85,
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(mx, my + 0.22 * mr, mr * 0.14, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  private drawHeadlights(ctx: CanvasRenderingContext2D): void {
    const night = this.nightAmount();
    if (night < 0.08) {
      return;
    }

    const w = this.carW;
    const h = this.carH;
    const bob =
      Math.sin(this.time * 9) * 1.3 +
      Math.sin(this.carBounce * Math.PI) * h * 0.08;
    const frontX = this.carX + w * 0.5;
    const frontY = this.carY + bob + h * 0.14;
    const endX = Math.min(this.width + 60, frontX + w * 4.6);

    ctx.save();
    ctx.globalAlpha = night;
    ctx.globalCompositeOperation = 'lighter';

    const beam = ctx.createLinearGradient(frontX, frontY, endX, frontY);
    beam.addColorStop(0, 'rgba(255, 246, 180, 0.32)');
    beam.addColorStop(0.55, 'rgba(255, 240, 150, 0.12)');
    beam.addColorStop(1, 'rgba(255, 240, 150, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(frontX, frontY - h * 0.08);
    ctx.lineTo(endX, frontY - h * 1.05);
    ctx.lineTo(endX, frontY + h * 1.05);
    ctx.lineTo(frontX, frontY + h * 0.22);
    ctx.closePath();
    ctx.fill();

    const glow = ctx.createRadialGradient(
      frontX,
      frontY,
      1,
      frontX,
      frontY,
      h * 1.1,
    );
    glow.addColorStop(0, 'rgba(255, 250, 200, 0.75)');
    glow.addColorStop(1, 'rgba(255, 250, 200, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(frontX, frontY, h * 1.1, 0, Math.PI * 2);
    ctx.fill();

    const rearX = this.carX - w * 0.48;
    const rearY = this.carY + bob + h * 0.2;
    const red = ctx.createRadialGradient(
      rearX,
      rearY,
      1,
      rearX,
      rearY,
      h * 0.75,
    );
    red.addColorStop(0, 'rgba(255, 90, 90, 0.45)');
    red.addColorStop(1, 'rgba(255, 90, 90, 0)');
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.arc(rearX, rearY, h * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawRain(ctx: CanvasRenderingContext2D): void {
    if (this.rainAmount < 0.03 || this.rainDrops.length === 0) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(190, 220, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (const drop of this.rainDrops) {
      ctx.globalAlpha = this.rainAmount * drop.alpha;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.18, drop.y + drop.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const night = this.nightAmount();
    const sky = ctx.createLinearGradient(0, 0, 0, this.roadTop);
    sky.addColorStop(0, skyColor(night, 0));
    sky.addColorStop(0.62, skyColor(night, 1));
    sky.addColorStop(1, skyColor(night, 2));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, this.roadTop);

    const sunHeight = this.sunHeight();
    const sunX = width * 0.78;
    const sunY = lerp(
      this.roadTop - height * 0.02,
      height * 0.12,
      sunHeight,
    );
    const sunAlpha =
      clamp(1 - night * 1.15, 0, 1) *
      clamp(1 - this.cloudsAmount * 0.55 - this.rainAmount * 0.25, 0, 1);

    if (sunAlpha > 0.01) {
      const sunR = Math.min(width, height) * 0.065;
      ctx.save();
      ctx.globalAlpha = sunAlpha;

      const glow = ctx.createRadialGradient(
        sunX,
        sunY,
        sunR * 0.4,
        sunX,
        sunY,
        sunR * 2.2,
      );
      glow.addColorStop(0, 'rgba(255, 220, 130, 0.6)');
      glow.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = mixColor(SUN_DAY, SUN_SET, night);
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const cloudColor = mixColor(
      CLOUD_WHITE,
      CLOUD_GRAY,
      this.cloudsAmount,
    );
    const baseCloudAlpha = 0.78 * (1 - night * 0.55);
    for (let index = 0; index < 4; index++) {
      const span = width + 280;
      const x = mod(index * 220 + 40 - this.time * 8, span) - 140;
      const y = height * 0.08 + (index % 2) * height * 0.05;
      const size = Math.min(width, height) * 0.034;
      this.drawCloud(ctx, x, y, size, cloudColor, baseCloudAlpha);
    }

    const extraCloudAlpha =
      this.cloudsAmount * 0.82 * (1 - night * 0.45);
    if (extraCloudAlpha > 0.01) {
      for (let index = 0; index < 4; index++) {
        const span = width + 240;
        const x = mod(index * 190 + 90 - this.time * 5, span) - 120;
        const y = height * (0.02 + (index % 3) * 0.045);
        const size =
          Math.min(width, height) * (0.055 + (index % 2) * 0.012);
        this.drawCloud(ctx, x, y, size, cloudColor, extraCloudAlpha);
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

    if (this.rainAmount > 0.01) {
      ctx.fillStyle = `rgba(180, 210, 240, ${this.rainAmount * 0.08})`;
      ctx.fillRect(0, this.roadTop, width, this.roadBottom - this.roadTop);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, this.roadTop, width, 3);
    ctx.fillRect(0, this.roadBottom - 3, width, 3);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([34, 26]);
    ctx.lineDashOffset = mod(this.scrollX, 60);

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
