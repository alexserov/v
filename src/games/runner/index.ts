import type { GameDefinition, GameInstance } from '../../types';

type ObstacleType = 'bush' | 'rock' | 'mushroom';

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: ObstacleType;
  hit: boolean;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

type FoodType = 'carrot' | 'broccoli' | 'apple' | 'strawberry' | 'blueberry';

interface Food {
  x: number;
  /** Height of the item's center above the ground. */
  y: number;
  radius: number;
  type: FoodType;
  bobPhase: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mod = (value: number, span: number) =>
  ((value % span) + span) % span;

class RunnerGame implements GameInstance {
  private host: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private observer: ResizeObserver | null = null;
  private frame = 0;
  private lastTime = 0;

  private width = 0;
  private height = 0;
  private groundY = 0;
  private playerRadius = 24;

  private elapsed = 0;
  private worldX = 0;
  private runPhase = 0;

  private playerY = 0;
  private playerVy = 0;
  private jumps = 0;
  private grounded = true;
  private squash = 0;

  private obstacles: Obstacle[] = [];
  private sparkles: Sparkle[] = [];
  private spawnTimer = 1.1;

  private foods: Food[] = [];
  private foodTimer = 0.8;
  private collected = 0;
  private scoreValue: HTMLElement | null = null;

  private jumpVelocity = 0;
  private gravity = 0;

  mount(host: HTMLElement): void {
    this.host = host;

    const canvas = document.createElement('canvas');
    canvas.className = 'runner-canvas';
    host.append(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const hud = document.createElement('div');
    hud.className = 'runner-hud';

    const score = document.createElement('div');
    score.className = 'runner-score';

    const scoreIcon = document.createElement('span');
    scoreIcon.className = 'runner-score__icon';
    scoreIcon.setAttribute('aria-hidden', 'true');
    scoreIcon.textContent = '🧺';

    const scoreValue = document.createElement('span');
    scoreValue.className = 'runner-score__value';
    scoreValue.textContent = '0';
    scoreValue.setAttribute('aria-live', 'polite');

    score.append(scoreIcon, scoreValue);
    hud.append(score);
    host.append(hud);
    this.scoreValue = scoreValue;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();

    host.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('keydown', this.onKeyDown);

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.observer = null;

    this.host?.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('keydown', this.onKeyDown);

    this.host?.replaceChildren();

    this.host = null;
    this.canvas = null;
    this.ctx = null;
    this.scoreValue = null;
  }

  private resize(): void {
    if (!this.host || !this.canvas) {
      return;
    }

    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    this.width = width;
    this.height = height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.groundY = height * 0.82;
    this.playerRadius = Math.min(width * 0.075, height * 0.055);
    this.gravity = height * 4.2;
    this.jumpVelocity = Math.sqrt(2 * this.gravity * height * 0.2);
  }

  private loop = (time: number): void => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    this.frame = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.elapsed += dt;

    const baseSpeed = Math.max(200, this.width * 0.55);
    const speed = baseSpeed * (1 + Math.min(this.elapsed / 90, 0.5));
    this.worldX += speed * dt;

    if (!this.grounded) {
      this.playerVy -= this.gravity * dt;
      this.playerY += this.playerVy * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.grounded = true;
        this.jumps = 0;
        this.squash = 0.35;
      }
    }

    this.squash = Math.max(0, this.squash - dt * 2.2);
    this.runPhase += dt * (this.grounded ? 16 : 7);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = 0.9 + Math.random() * 0.9;
    }

    for (const obstacle of this.obstacles) {
      obstacle.x -= speed * dt;
    }
    this.obstacles = this.obstacles.filter(
      (obstacle) => obstacle.x + obstacle.width > -60,
    );

    this.foodTimer -= dt;
    if (this.foodTimer <= 0) {
      this.spawnFood();
      this.foodTimer = 0.55 + Math.random() * 0.65;
    }

    for (const food of this.foods) {
      food.x -= speed * dt;
      food.bobPhase += dt * 3;
    }

    const playerLeft = this.width * 0.22 - this.playerRadius * 0.62;
    const playerRight = this.width * 0.22 + this.playerRadius * 0.62;
    const playerTop =
      this.groundY - this.playerY - this.playerRadius * 1.75;
    const playerBottom =
      this.groundY - this.playerY - this.playerRadius * 0.35;

    for (const obstacle of this.obstacles) {
      if (obstacle.hit) {
        continue;
      }

      const overlaps =
        playerRight > obstacle.x &&
        playerLeft < obstacle.x + obstacle.width &&
        playerBottom > this.groundY - obstacle.height &&
        playerTop < this.groundY;

      if (!overlaps) {
        continue;
      }

      // Games never end: a bump just gives a soft hop and some sparkles.
      obstacle.hit = true;
      if (this.grounded) {
        this.playerVy = this.jumpVelocity * 0.5;
        this.grounded = false;
        this.jumps = 1;
      }
      this.emitSparkles(
        obstacle.x + obstacle.width / 2,
        this.groundY - obstacle.height * 0.6,
        10,
      );
    }

    const playerCenterX = this.width * 0.22;
    const playerCenterY =
      this.groundY - this.playerY - this.playerRadius * 1.05;
    const reach = this.playerRadius * 0.95;

    this.foods = this.foods.filter((food) => {
      if (food.x + food.radius < -40) {
        return false;
      }

      const dx = food.x - playerCenterX;
      const dy = this.groundY - food.y - playerCenterY;
      const limit = reach + food.radius;

      if (dx * dx + dy * dy <= limit * limit) {
        this.collectFood(food);
        return false;
      }

      return true;
    });

    for (const sparkle of this.sparkles) {
      sparkle.life -= dt;
      sparkle.x += sparkle.vx * dt;
      sparkle.y += sparkle.vy * dt;
      sparkle.vy += this.gravity * 0.35 * dt;
    }
    this.sparkles = this.sparkles.filter((sparkle) => sparkle.life > 0);
  }

  private spawnObstacle(): void {
    const radius = this.playerRadius;
    const types: ObstacleType[] = ['bush', 'rock', 'mushroom'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = radius * 1.7;
    let height = radius * 1.3;

    if (type === 'rock') {
      width = radius * 1.9;
      height = radius * 1.15;
    } else if (type === 'mushroom') {
      width = radius * 1.3;
      height = radius * 1.55;
    }

    this.obstacles.push({
      x: this.width + 40,
      width,
      height,
      type,
      hit: false,
    });
  }

  private spawnFood(): void {
    const radius = this.playerRadius * 0.85;
    const types: FoodType[] = [
      'carrot',
      'broccoli',
      'apple',
      'strawberry',
      'blueberry',
    ];
    // Groups of three are a rare treat now.
    const cluster = Math.random() < 0.15 ? 3 : 1;
    const startX = this.width + 40;

    // Height tiers: low and easy, a normal jump, and high ones that need
    // the second jump to reach.
    const tier = Math.random();
    let baseHeight: number;

    if (tier < 0.25) {
      baseHeight = this.playerRadius * (9 + Math.random() * 2);
    } else if (tier < 0.6) {
      baseHeight = this.playerRadius * (4 + Math.random() * 2.5);
    } else {
      baseHeight = this.playerRadius * (1.2 + Math.random() * 1.8);
    }

    for (let index = 0; index < cluster; index++) {
      const arc =
        cluster > 1 ? ((index + 0.5) / cluster) * Math.PI : 0;
      const height =
        cluster > 1
          ? baseHeight * (0.85 + Math.sin(arc) * 0.3)
          : baseHeight;

      this.foods.push({
        x: startX + index * this.playerRadius * 2,
        y: height,
        radius,
        type: types[Math.floor(Math.random() * types.length)],
        bobPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private collectFood(food: Food): void {
    this.collected += 1;
    this.emitSparkles(food.x, this.groundY - food.y, 9);

    if (!this.scoreValue) {
      return;
    }

    this.scoreValue.textContent = String(this.collected);
    this.scoreValue.classList.remove('is-pop');
    void this.scoreValue.offsetWidth;
    this.scoreValue.classList.add('is-pop');
  }

  private emitSparkles(x: number, y: number, count: number): void {
    const colors = ['#ffe36e', '#ff9ecb', '#a78bfa', '#ffffff'];

    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 150;
      const life = 0.5 + Math.random() * 0.4;

      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life,
        maxLife: life,
        size: 2 + Math.random() * 3,
        color: colors[index % colors.length],
      });
    }
  }

  private jump(): void {
    if (this.jumps >= 2) {
      return;
    }

    this.playerVy = this.jumpVelocity;
    this.grounded = false;
    this.jumps += 1;
    this.squash = 0.25;
    this.emitSparkles(
      this.width * 0.22,
      this.groundY - this.playerY - this.playerRadius,
      5,
    );
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.jump();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      this.jump();
    }
  };

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx);

    for (const obstacle of this.obstacles) {
      this.drawObstacle(ctx, obstacle);
    }

    for (const food of this.foods) {
      this.drawFood(ctx, food);
    }

    this.drawPlayer(ctx);
    this.drawSparkles(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;
    const groundY = this.groundY;

    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(0.55, '#ffe2f1');
    sky.addColorStop(1, '#fff0d9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, groundY + 2);

    const sunX = width * 0.8;
    const sunY = height * 0.14;
    const sunR = Math.min(width, height) * 0.085;

    const glow = ctx.createRadialGradient(
      sunX,
      sunY,
      sunR * 0.4,
      sunX,
      sunY,
      sunR * 2,
    );
    glow.addColorStop(0, 'rgba(255, 235, 130, 0.7)');
    glow.addColorStop(1, 'rgba(255, 235, 130, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe36e';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    this.drawClouds(ctx);
    this.drawHills(ctx, 0.25, groundY - height * 0.1, height * 0.05, '#cdeccb');
    this.drawHills(
      ctx,
      0.45,
      groundY - height * 0.045,
      height * 0.04,
      '#b3e3b4',
    );

    const grass = ctx.createLinearGradient(0, groundY, 0, height);
    grass.addColorStop(0, '#86d97f');
    grass.addColorStop(1, '#4aa95f');
    ctx.fillStyle = grass;
    ctx.fillRect(0, groundY, width, height - groundY);

    ctx.fillStyle = '#6fca70';
    ctx.fillRect(0, groundY - 3, width, 6);

    this.drawGroundDetails(ctx);
  }

  private drawClouds(ctx: CanvasRenderingContext2D): void {
    const span = this.width + 320;

    for (let index = 0; index < 4; index++) {
      const base = index * 220 + 40;
      const x = mod(base - this.worldX * 0.15, span) - 160;
      const y = this.height * 0.1 + (index % 2) * this.height * 0.06;
      const size =
        Math.min(this.width, this.height) *
        0.045 *
        (0.9 + (index % 3) * 0.18);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.arc(x + size * 0.85, y + size * 0.12, size * 0.78, 0, Math.PI * 2);
      ctx.arc(x - size * 0.85, y + size * 0.15, size * 0.68, 0, Math.PI * 2);
      ctx.fill();
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
      const phase = ((x + this.worldX * parallax) / wavelength) * Math.PI * 2;
      const y =
        baseY -
        Math.sin(phase) * amplitude -
        Math.sin(phase * 2.1 + 1.3) * amplitude * 0.35;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, this.height);
    ctx.closePath();
    ctx.fill();
  }

  private drawGroundDetails(ctx: CanvasRenderingContext2D): void {
    const spacing = 90;
    const span = this.width + spacing * 2;
    const count = Math.ceil(span / spacing) + 1;

    for (let index = 0; index < count; index++) {
      const x = mod(index * spacing - this.worldX, span) - spacing;

      if (index % 3 === 0) {
        const flowerY = this.groundY + this.height * 0.07;
        ctx.fillStyle = '#fff4a8';
        for (let petal = 0; petal < 5; petal++) {
          const angle = (petal / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(
            x + Math.cos(angle) * 4,
            flowerY + Math.sin(angle) * 4,
            3.2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.fillStyle = '#ffb347';
        ctx.beginPath();
        ctx.arc(x, flowerY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grassY = this.groundY + this.height * 0.09;
        ctx.strokeStyle = '#5cbb66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, grassY);
        ctx.quadraticCurveTo(
          x - 3,
          grassY - this.height * 0.03,
          x - 6,
          grassY - this.height * 0.04,
        );
        ctx.moveTo(x, grassY);
        ctx.quadraticCurveTo(
          x + 3,
          grassY - this.height * 0.03,
          x + 6,
          grassY - this.height * 0.04,
        );
        ctx.stroke();
      }
    }
  }

  private drawObstacle(
    ctx: CanvasRenderingContext2D,
    obstacle: Obstacle,
  ): void {
    const bottom = this.groundY;
    const top = bottom - obstacle.height;
    const x = obstacle.x;
    const width = obstacle.width;

    if (obstacle.type === 'bush') {
      const gradient = ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, '#68c96f');
      gradient.addColorStop(1, '#3f9e52');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x + width * 0.3, bottom - obstacle.height * 0.42, obstacle.height * 0.42, 0, Math.PI * 2);
      ctx.arc(x + width * 0.7, bottom - obstacle.height * 0.42, obstacle.height * 0.42, 0, Math.PI * 2);
      ctx.arc(x + width * 0.5, top + obstacle.height * 0.4, obstacle.height * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + width * 0.1, bottom - obstacle.height * 0.4, width * 0.8, obstacle.height * 0.4);
      return;
    }

    if (obstacle.type === 'rock') {
      const gradient = ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, '#c8ccd8');
      gradient.addColorStop(1, '#9aa2b5');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x + width * 0.15, top + obstacle.height * 0.25);
      ctx.lineTo(x + width * 0.45, top);
      ctx.lineTo(x + width * 0.8, top + obstacle.height * 0.2);
      ctx.lineTo(x + width, bottom);
      ctx.closePath();
      ctx.fill();
      return;
    }

    const stemWidth = width * 0.36;
    ctx.fillStyle = '#fff2df';
    ctx.beginPath();
    ctx.roundRect(
      x + (width - stemWidth) / 2,
      top + obstacle.height * 0.45,
      stemWidth,
      obstacle.height * 0.55,
      stemWidth * 0.3,
    );
    ctx.fill();

    const cap = ctx.createLinearGradient(0, top, 0, top + obstacle.height * 0.6);
    cap.addColorStop(0, '#ff8a8a');
    cap.addColorStop(1, '#e65858');
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      top + obstacle.height * 0.42,
      width * 0.55,
      obstacle.height * 0.42,
      0,
      Math.PI,
      0,
    );
    ctx.fill();

    ctx.fillStyle = '#fff6f6';
    ctx.beginPath();
    ctx.arc(x + width * 0.32, top + obstacle.height * 0.28, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.68, top + obstacle.height * 0.34, width * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const radius = this.playerRadius;
    const cx = this.width * 0.22;
    const baseY = this.groundY - this.playerY;
    const bob = this.grounded ? Math.sin(this.runPhase * 2) * radius * 0.05 : 0;
    const cy = baseY - radius * 1.05 + bob;

    const shadowScale = clamp(
      1 - this.playerY / (this.height * 0.25),
      0.35,
      1,
    );
    ctx.fillStyle = 'rgba(60, 90, 60, 0.18)';
    ctx.beginPath();
    ctx.ellipse(
      cx,
      this.groundY + 4,
      radius * 0.95 * shadowScale,
      radius * 0.3 * shadowScale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    const squash = 1 - this.squash * 0.35;
    ctx.scale(1 + this.squash * 0.2, squash);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-radius * 0.92, radius * 0.38, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    const tilt = this.grounded ? Math.sin(this.runPhase * 2) * 0.12 : -0.2;
    this.drawEar(ctx, -radius * 0.4, -radius * 0.78, tilt, radius);
    this.drawEar(ctx, radius * 0.4, -radius * 0.78, -tilt, radius);

    const step = this.grounded ? Math.sin(this.runPhase * 2) : 0;
    ctx.fillStyle = '#ffd3e7';
    ctx.beginPath();
    ctx.ellipse(
      -radius * 0.4,
      radius * 0.92 - step * radius * 0.14,
      radius * 0.32,
      radius * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      radius * 0.4,
      radius * 0.92 + step * radius * 0.14,
      radius * 0.32,
      radius * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const body = ctx.createRadialGradient(
      -radius * 0.3,
      -radius * 0.4,
      radius * 0.15,
      0,
      0,
      radius * 1.15,
    );
    body.addColorStop(0, '#ffffff');
    body.addColorStop(1, '#ffe2f0');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 140, 185, 0.55)';
    ctx.beginPath();
    ctx.arc(-radius * 0.52, radius * 0.18, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.52, radius * 0.18, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a2b5e';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.08, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.3, -radius * 0.08, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-radius * 0.27, -radius * 0.12, radius * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.33, -radius * 0.12, radius * 0.035, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff8fbf';
    ctx.beginPath();
    ctx.arc(0, radius * 0.14, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawEar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tilt: number,
    radius: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.55, radius * 0.22, radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffc7e0';
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.55, radius * 0.1, radius * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawFood(ctx: CanvasRenderingContext2D, food: Food): void {
    const size = food.radius;
    const x = food.x;
    const y =
      this.groundY - food.y + Math.sin(food.bobPhase) * size * 0.12;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.15, 0, Math.PI * 2);
    ctx.fill();

    switch (food.type) {
      case 'carrot':
        this.drawCarrot(ctx, size);
        break;
      case 'broccoli':
        this.drawBroccoli(ctx, size);
        break;
      case 'apple':
        this.drawApple(ctx, size);
        break;
      case 'strawberry':
        this.drawStrawberry(ctx, size);
        break;
      case 'blueberry':
        this.drawBlueberry(ctx, size);
        break;
    }

    ctx.restore();
  }

  private drawCarrot(ctx: CanvasRenderingContext2D, size: number): void {
    const s = size;

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

  private drawBroccoli(ctx: CanvasRenderingContext2D, size: number): void {
    const s = size;

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

  private drawApple(ctx: CanvasRenderingContext2D, size: number): void {
    const s = size;

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

  private drawStrawberry(ctx: CanvasRenderingContext2D, size: number): void {
    const s = size;

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

  private drawBlueberry(ctx: CanvasRenderingContext2D, size: number): void {
    const s = size;

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

  private drawSparkles(ctx: CanvasRenderingContext2D): void {
    for (const sparkle of this.sparkles) {
      const alpha = clamp(sparkle.life / sparkle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sparkle.color;
      ctx.beginPath();
      ctx.arc(sparkle.x, sparkle.y, sparkle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export const runnerGame: GameDefinition = {
  id: 'runner',
  title: 'Бегунок',
  icon: '🐰',
  colors: ['#ffd36e', '#ff9f43'],
  create: () => new RunnerGame(),
};
