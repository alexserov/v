import {
  animalBodyColor,
  drawAnimalHead,
  type AnimalKind,
} from '../../art/characters';
import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import type { GameDefinition } from '../../types';

interface Flower {
  x: number;
  y: number;
  radius: number;
  color: string;
  center: string;
  note: number;
  animal: number;
  bounce: number;
  sway: number;
}

interface SittingAnimal {
  kind: AnimalKind;
  x: number;
  y: number;
  size: number;
  body: string;
  dance: number;
  bob: number;
}

interface FloatingNote {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glyph: string;
  phase: number;
}

const FLOWER_STYLES = [
  { color: '#ff9ecb', center: '#ffe36e' },
  { color: '#ffd36e', center: '#ffb347' },
  { color: '#8fe3c8', center: '#ffe36e' },
  { color: '#a78bfa', center: '#ffe36e' },
  { color: '#7fc8ff', center: '#ffe36e' },
  { color: '#ffb347', center: '#ffe36e' },
];

const GLYPHS = ['♪', '♫', '♩', '♬'];
const mod = (value: number, span: number) => ((value % span) + span) % span;

class MusicGame extends CanvasGame {
  private flowers: Flower[] = [];
  private animals: SittingAnimal[] = [];
  private notes: FloatingNote[] = [];
  private particles = new Particles();
  private time = 0;

  protected onMount(): void {
    this.layout();
  }

  protected onResize(): void {
    this.layout();
  }

  private layout(): void {
    const side = Math.min(this.width, this.height);

    this.flowers = FLOWER_STYLES.map((style, index) => ({
      x: this.width * (0.11 + index * 0.156),
      y: this.height * (0.77 - Math.sin((index / 5) * Math.PI) * 0.045),
      radius: side * (0.073 + (index % 2) * 0.006),
      color: style.color,
      center: style.center,
      note: index,
      animal: index % 3,
      bounce: 0,
      sway: Math.random() * Math.PI * 2,
    }));

    const animalKinds: AnimalKind[] = ['bunny', 'bear', 'fox'];
    const xs = [0.18, 0.5, 0.82];
    const size = side * 0.06;
    const groundTop = this.height * 0.62;

    this.animals = animalKinds.map((kind, index) => ({
      kind,
      x: this.width * xs[index],
      y: groundTop - size * 1.4,
      size,
      body: animalBodyColor(kind),
      dance: 0,
      bob: Math.random() * Math.PI * 2,
    }));
  }

  protected update(dt: number): void {
    this.time += dt;

    for (const flower of this.flowers) {
      flower.bounce = Math.max(0, flower.bounce - dt * 3.2);
      flower.sway += dt * 0.9;
    }

    for (const animal of this.animals) {
      animal.dance = Math.max(0, animal.dance - dt * 1.6);
      animal.bob += dt * 1.8;
    }

    for (const note of this.notes) {
      note.life -= dt;
      note.y += note.vy * dt;
      note.phase += dt * 4;
    }
    this.notes = this.notes.filter((note) => note.life > 0);

    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);

    for (const animal of this.animals) {
      this.drawAnimal(ctx, animal);
    }

    for (const flower of this.flowers) {
      this.drawStem(ctx, flower);
    }

    for (const flower of this.flowers) {
      this.drawFlower(ctx, flower);
    }

    for (const note of this.notes) {
      this.drawNote(ctx, note);
    }

    this.particles.draw(ctx);
  }

  protected onTap(x: number, y: number): void {
    for (const flower of this.flowers) {
      const dx = x - flower.x;
      const dy = y - flower.y;
      const reach = flower.radius * 1.2;
      if (dx * dx + dy * dy > reach * reach) {
        continue;
      }
      this.play(flower);
      return;
    }
  }

  private play(flower: Flower): void {
    flower.bounce = 1;
    sound.chime(flower.note);

    const animal = this.animals[flower.animal];
    if (animal) {
      animal.dance = 1;
    }

    this.particles.burst(flower.x, flower.y, {
      count: 9,
      colors: [flower.color, flower.center, '#ffffff'],
      minSpeed: 40,
      maxSpeed: 150,
      life: 0.6,
      gravity: 60,
      size: 3,
    });

    for (let index = 0; index < 3; index++) {
      const life = 1 + Math.random() * 0.5;
      this.notes.push({
        x: flower.x + (Math.random() - 0.5) * flower.radius,
        y: flower.y - flower.radius * 0.3,
        vy: -34 - Math.random() * 40,
        life,
        maxLife: life,
        size: flower.radius * (0.5 + Math.random() * 0.25),
        color: index === 0 ? flower.color : '#8a6bff',
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
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

    const sunX = width * 0.8;
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
    ground.addColorStop(0.45, '#86d97f');
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let index = 0; index < 6; index++) {
      ctx.beginPath();
      ctx.ellipse(
        width * (0.1 + index * 0.16),
        height * (0.82 + (index % 2) * 0.06),
        width * 0.06,
        height * 0.008,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  private drawAnimal(
    ctx: CanvasRenderingContext2D,
    animal: SittingAnimal,
  ): void {
    const danceLift =
      Math.abs(Math.sin(animal.dance * Math.PI * 2)) * animal.size * 0.35;
    const bob = Math.sin(animal.bob) * animal.size * 0.04;
    const y = animal.y - danceLift + bob;
    const size = animal.size;

    ctx.save();
    ctx.translate(animal.x, y);
    ctx.rotate(Math.sin(animal.dance * Math.PI * 2) * 0.08);

    ctx.fillStyle = 'rgba(60, 90, 60, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, size * 1.75, size * 0.9, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = animal.body;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.95, size * 0.8, size * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.35, size * 1.15, size * 0.22, size * 0.14, -0.3, 0, Math.PI * 2);
    ctx.fill();

    drawAnimalHead(ctx, animal.kind, size, {
      expression: animal.dance > 0.05 ? 'wink' : 'happy',
      blush: true,
    });

    ctx.restore();
  }

  private drawStem(ctx: CanvasRenderingContext2D, flower: Flower): void {
    const r = flower.radius;
    const groundY = this.height * 0.94;
    const sway = Math.sin(flower.sway) * r * 0.08;

    ctx.strokeStyle = '#4fa85c';
    ctx.lineWidth = Math.max(3, r * 0.13);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(flower.x, groundY);
    ctx.quadraticCurveTo(
      flower.x + sway,
      (flower.y + groundY) / 2,
      flower.x + sway * 0.5,
      flower.y,
    );
    ctx.stroke();

    ctx.fillStyle = '#6fca70';
    ctx.beginPath();
    ctx.ellipse(
      flower.x - r * 0.22,
      flower.y + (groundY - flower.y) * 0.44,
      r * 0.34,
      r * 0.14,
      -0.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      flower.x + r * 0.24,
      flower.y + (groundY - flower.y) * 0.62,
      r * 0.3,
      r * 0.12,
      0.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  private drawFlower(ctx: CanvasRenderingContext2D, flower: Flower): void {
    const r = flower.radius;
    const lift = Math.sin(flower.bounce * Math.PI) * r * 0.28;
    const scale = 1 + Math.sin(flower.bounce * Math.PI) * 0.12;
    const sway = Math.sin(flower.sway) * 0.05;

    ctx.save();
    ctx.translate(flower.x, flower.y - lift);
    ctx.rotate(sway);
    ctx.scale(scale, scale);

    ctx.fillStyle = flower.color;
    for (let petal = 0; petal < 6; petal++) {
      ctx.save();
      ctx.rotate((petal / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.55, r * 0.27, r * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let petal = 0; petal < 6; petal++) {
      ctx.save();
      ctx.rotate((petal / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(-r * 0.06, -r * 0.62, r * 0.1, r * 0.2, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = flower.center;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(-r * 0.11, -r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawNote(ctx: CanvasRenderingContext2D, note: FloatingNote): void {
    const alpha = Math.max(0, note.life / note.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = note.color;
    ctx.font = `800 ${note.size}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(note.x + Math.sin(note.phase) * note.size * 0.2, note.y);
    ctx.rotate(Math.sin(note.phase) * 0.15);
    ctx.fillText(note.glyph, 0, 0);
    ctx.restore();
  }
}

export const musicGame: GameDefinition = {
  id: 'music',
  title: 'Музыкальная полянка',
  icon: '🎵',
  colors: ['#c3a6ff', '#7c5cff'],
  create: () => new MusicGame(),
};
