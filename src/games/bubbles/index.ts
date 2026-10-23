import { ANIMAL_KINDS, drawAnimalHead } from '../../art/characters';
import type { AnimalKind } from '../../art/characters';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import { createHud, type Hud } from '../../ui/hud';
import type { GameDefinition } from '../../types';

interface Bubble {
  x: number;
  y: number;
  baseX: number;
  radius: number;
  speed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  animal: AnimalKind | null;
}

interface FreedAnimal {
  x: number;
  y: number;
  radius: number;
  animal: AnimalKind;
  life: number;
  maxLife: number;
  phase: number;
}

const mod = (value: number, span: number) => ((value % span) + span) % span;

class BubblesGame extends CanvasGame {
  private bubbles: Bubble[] = [];
  private freed: FreedAnimal[] = [];
  private particles = new Particles();
  private hud: Hud | null = null;
  private spawnTimer = 0.15;
  private popped = 0;
  private time = 0;

  protected onMount(): void {
    if (!this.host) {
      return;
    }
    this.hud = createHud(this.host, { icon: '🫧', initial: 0 });
    this.prepopulate();
  }

  protected onDestroy(): void {
    this.hud?.destroy();
    this.hud = null;
  }

  protected update(dt: number): void {
    this.time += dt;
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0 && this.bubbles.length < 14) {
      this.spawnBubble();
      this.spawnTimer = 0.34 + Math.random() * 0.42;
    }

    for (const bubble of this.bubbles) {
      bubble.y -= bubble.speed * dt;
      bubble.swayPhase += bubble.swaySpeed * dt;
      bubble.x = bubble.baseX + Math.sin(bubble.swayPhase) * bubble.swayAmp;
    }
    this.bubbles = this.bubbles.filter(
      (bubble) => bubble.y + bubble.radius > -40,
    );

    for (const animal of this.freed) {
      animal.life -= dt;
      animal.y -= 72 * dt;
      animal.phase += dt * 6;
    }
    this.freed = this.freed.filter((animal) => animal.life > 0);

    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);

    const sorted = [...this.bubbles].sort((a, b) => b.radius - a.radius);
    for (const bubble of sorted) {
      this.drawBubble(ctx, bubble);
    }

    for (const animal of this.freed) {
      this.drawFreedAnimal(ctx, animal);
    }

    this.particles.draw(ctx);
  }

  protected onTap(x: number, y: number): void {
    for (let index = this.bubbles.length - 1; index >= 0; index--) {
      const bubble = this.bubbles[index];
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const reach = bubble.radius * 1.12;

      if (dx * dx + dy * dy <= reach * reach) {
        this.popBubble(index);
        return;
      }
    }
  }

  private spawnBubble(): void {
    const side = Math.min(this.width, this.height);
    const radius = side * (0.05 + Math.random() * 0.06);
    const margin = radius + 12;
    const baseX = margin + Math.random() * Math.max(1, this.width - margin * 2);

    this.bubbles.push({
      x: baseX,
      y: this.height + radius,
      baseX,
      radius,
      speed: this.height * (0.06 + Math.random() * 0.07),
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 0.8,
      swayAmp: radius * (0.3 + Math.random() * 0.5),
      animal:
        Math.random() < 0.45
          ? ANIMAL_KINDS[Math.floor(Math.random() * ANIMAL_KINDS.length)]
          : null,
    });
  }

  private prepopulate(): void {
    for (let index = 0; index < 5; index++) {
      this.spawnBubble();
      const bubble = this.bubbles[this.bubbles.length - 1];
      if (!bubble) {
        continue;
      }
      bubble.y = this.height * (0.25 + Math.random() * 0.7);
      const margin = bubble.radius + 12;
      bubble.baseX =
        margin + Math.random() * Math.max(1, this.width - margin * 2);
      bubble.x = bubble.baseX;
    }
  }

  private popBubble(index: number): void {
    const [bubble] = this.bubbles.splice(index, 1);
    if (!bubble) {
      return;
    }

    this.popped += 1;
    this.hud?.setValue(this.popped);
    sound.pop(bubble.radius / 42);

    this.particles.burst(bubble.x, bubble.y, {
      count: 13,
      colors: ['#ffffff', '#a0e7ff', '#ffc2e8', '#fff4a8', '#c3a6ff'],
      minSpeed: 40,
      maxSpeed: 190,
      size: Math.max(2, bubble.radius * 0.08),
      life: 0.55,
      gravity: 120,
    });

    if (bubble.animal) {
      sound.sparkle();
      this.freed.push({
        x: bubble.x,
        y: bubble.y,
        radius: bubble.radius * 0.42,
        animal: bubble.animal,
        life: 1.2,
        maxLife: 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(0.5, '#ffe2f1');
    sky.addColorStop(1, '#fff0d9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const sunX = width * 0.8;
    const sunY = height * 0.12;
    const sunR = Math.min(width, height) * 0.075;

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

    for (let index = 0; index < 4; index++) {
      const span = width + 300;
      const x =
        mod(index * 220 + 40 + this.time * 7, span) - 150;
      const y = height * 0.1 + (index % 2) * height * 0.07;
      const size = Math.min(width, height) * 0.04 * (0.9 + (index % 3) * 0.2);
      drawCloud(ctx, x, y, size);
    }

    const groundY = height * 0.86;
    ctx.fillStyle = '#cdeccb';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 8; x += 8) {
      const phase = ((x + this.time * 10) / (width * 1.1)) * Math.PI * 2;
      const y = groundY - Math.sin(phase) * height * 0.035;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    const grass = ctx.createLinearGradient(0, groundY, 0, height);
    grass.addColorStop(0, '#9fe08f');
    grass.addColorStop(1, '#5cbb66');
    ctx.fillStyle = grass;
    ctx.fillRect(0, groundY + height * 0.02, width, height);
  }

  private drawBubble(ctx: CanvasRenderingContext2D, bubble: Bubble): void {
    const r = bubble.radius;

    ctx.save();
    ctx.translate(bubble.x, bubble.y);

    const fill = ctx.createRadialGradient(
      -r * 0.3,
      -r * 0.35,
      r * 0.1,
      0,
      0,
      r,
    );
    fill.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    fill.addColorStop(0.65, 'rgba(185, 232, 255, 0.2)');
    fill.addColorStop(1, 'rgba(150, 200, 255, 0.32)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 170, 220, 0.55)';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, -0.7, 0.5);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.36, -r * 0.4, r * 0.18, r * 0.11, -0.6, 0, Math.PI * 2);
    ctx.fill();

    if (bubble.animal) {
      ctx.save();
      ctx.translate(0, r * 0.18);
      drawAnimalHead(ctx, bubble.animal, r * 0.42, {
        expression: 'happy',
        blush: true,
      });
      ctx.restore();
    }

    ctx.restore();
  }

  private drawFreedAnimal(
    ctx: CanvasRenderingContext2D,
    animal: FreedAnimal,
  ): void {
    const alpha = Math.max(0, animal.life / animal.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(
      animal.x + Math.sin(animal.phase) * animal.radius * 0.4,
      animal.y,
    );
    ctx.rotate(Math.sin(animal.phase) * 0.12);
    drawAnimalHead(ctx, animal.animal, animal.radius, {
      expression: 'wink',
      blush: true,
    });
    ctx.restore();
  }
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.arc(x + size * 0.85, y + size * 0.12, size * 0.78, 0, Math.PI * 2);
  ctx.arc(x - size * 0.85, y + size * 0.15, size * 0.68, 0, Math.PI * 2);
  ctx.fill();
}

export const bubblesGame: GameDefinition = {
  id: 'bubbles',
  title: 'Пузырики',
  icon: '🫧',
  colors: ['#a0e7ff', '#5aa9ff'],
  create: () => new BubblesGame(),
};
