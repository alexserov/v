interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'heart';
  rotation: number;
  spin: number;
}

export interface BurstOptions {
  count?: number;
  colors?: string[];
  minSpeed?: number;
  maxSpeed?: number;
  gravity?: number;
  life?: number;
  size?: number;
  shape?: 'mixed' | 'star' | 'heart';
}

const DEFAULT_COLORS = ['#ffe36e', '#ff9ecb', '#a78bfa', '#ffffff', '#8fe3c8'];

export class Particles {
  private items: Particle[] = [];

  get count(): number {
    return this.items.length;
  }

  burst(x: number, y: number, options: BurstOptions = {}): void {
    const count = options.count ?? 10;
    const colors = options.colors ?? DEFAULT_COLORS;
    const minSpeed = options.minSpeed ?? 60;
    const maxSpeed = options.maxSpeed ?? 200;
    const gravity = options.gravity ?? 320;
    const lifeBase = options.life ?? 0.6;
    const sizeBase = options.size ?? 3.2;

    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const life = lifeBase * (0.7 + Math.random() * 0.6);

      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity,
        life,
        maxLife: life,
        size: sizeBase * (0.6 + Math.random() * 0.8),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape:
          options.shape === 'heart'
            ? 'heart'
            : options.shape === 'star'
              ? 'star'
              : Math.random() < 0.3
                ? 'star'
                : 'circle',
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  }

  hearts(x: number, y: number, count = 8): void {
    this.burst(x, y, {
      count,
      shape: 'heart',
      colors: ['#ff7fb6', '#ff9ecb', '#ff4f8b', '#ffd1e6'],
      minSpeed: 35,
      maxSpeed: 110,
      gravity: -25,
      life: 0.9,
      size: 5,
    });
  }

  update(dt: number): void {
    for (const item of this.items) {
      item.life -= dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy += item.gravity * dt;
      item.rotation += item.spin * dt;
    }
    this.items = this.items.filter((item) => item.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const item of this.items) {
      const alpha = Math.max(0, Math.min(1, item.life / item.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.fillStyle = item.color;

      if (item.shape === 'star') {
        drawStar(ctx, item.size * alpha);
      } else if (item.shape === 'heart') {
        drawHeart(ctx, item.size * alpha);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, item.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.items = [];
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number): void {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.75);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.1, -s * 0.6, -s * 0.95, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.6, -s * 0.95, s * 1.1, -s * 0.1, 0, s * 0.75);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number): void {
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
  ctx.fill();
}
