import { CanvasGame } from '../../engine/CanvasGame';
import { Particles } from '../../engine/particles';
import { sound } from '../../engine/sound';
import type { GameDefinition } from '../../types';

type Category =
  | 'hat'
  | 'scarf'
  | 'glasses'
  | 'gloves'
  | 'sweater'
  | 'shoes';
type Outfit = Record<Category, string | null>;

interface AccessoryDef {
  id: string;
  category: Category;
  color: string;
  style?: string;
}

const CATEGORIES: ReadonlyArray<{ id: Category; icon: string; label: string }> = [
  { id: 'hat', icon: '🎩', label: 'Шапочки' },
  { id: 'scarf', icon: '🧣', label: 'Шарфики' },
  { id: 'glasses', icon: '👓', label: 'Очки' },
  { id: 'gloves', icon: '🧤', label: 'Перчатки' },
  { id: 'sweater', icon: '🧥', label: 'Кофточки' },
  { id: 'shoes', icon: '👟', label: 'Обувь' },
];

const ACCESSORIES: readonly AccessoryDef[] = [
  { id: 'hat-party', category: 'hat', color: '#a78bfa', style: 'party' },
  { id: 'hat-beanie', category: 'hat', color: '#ff9ecb', style: 'beanie' },
  { id: 'hat-crown', category: 'hat', color: '#ffd36e', style: 'crown' },
  { id: 'hat-cap', category: 'hat', color: '#7fc8ff', style: 'cap' },

  { id: 'scarf-pink', category: 'scarf', color: '#ff8fbf' },
  { id: 'scarf-mint', category: 'scarf', color: '#5ed0b0' },
  { id: 'scarf-purple', category: 'scarf', color: '#a78bfa' },
  { id: 'scarf-yellow', category: 'scarf', color: '#ffd36e' },

  { id: 'glasses-round', category: 'glasses', color: '#6a3f86', style: 'round' },
  { id: 'glasses-square', category: 'glasses', color: '#5a4a8a', style: 'square' },
  { id: 'glasses-heart', category: 'glasses', color: '#ff6f91', style: 'heart' },
  { id: 'glasses-star', category: 'glasses', color: '#ffb347', style: 'star' },

  { id: 'gloves-pink', category: 'gloves', color: '#ff7fb6' },
  { id: 'gloves-mint', category: 'gloves', color: '#5ed0b0' },
  { id: 'gloves-purple', category: 'gloves', color: '#9b7bff' },
  { id: 'gloves-blue', category: 'gloves', color: '#7fc8ff' },

  { id: 'sweater-pink', category: 'sweater', color: '#ffb3d9' },
  { id: 'sweater-mint', category: 'sweater', color: '#8fe3c8' },
  { id: 'sweater-purple', category: 'sweater', color: '#b8a6ff' },
  { id: 'sweater-yellow', category: 'sweater', color: '#ffd36e' },

  { id: 'shoes-red', category: 'shoes', color: '#ff6f6f' },
  { id: 'shoes-blue', category: 'shoes', color: '#7fc8ff' },
  { id: 'shoes-green', category: 'shoes', color: '#5ed0b0' },
  { id: 'shoes-purple', category: 'shoes', color: '#9b7bff' },
];

const findAccessory = (id: string | null): AccessoryDef | undefined =>
  id ? ACCESSORIES.find((item) => item.id === id) : undefined;

class DressupGame extends CanvasGame {
  private outfit: Outfit = {
    hat: null,
    scarf: null,
    glasses: null,
    gloves: null,
    sweater: null,
    shoes: null,
  };
  private category: Category = 'hat';

  private particles = new Particles();
  private wardrobe: HTMLElement | null = null;
  private tabsEl: HTMLElement | null = null;
  private itemsEl: HTMLElement | null = null;

  private bunnyX = 0;
  private bunnyY = 0;
  private headR = 0;
  private time = 0;

  private blink = 0;
  private blinkTimer = 2.4;
  private react = 0;

  protected onMount(): void {
    if (!this.host) {
      return;
    }
    this.layout();
    this.buildWardrobe(this.host);
  }

  protected onDestroy(): void {
    this.wardrobe?.remove();
    this.wardrobe = null;
    this.tabsEl = null;
    this.itemsEl = null;
  }

  protected onResize(): void {
    this.layout();
  }

  private layout(): void {
    this.bunnyX = this.width / 2;
    this.bunnyY = this.height * 0.44;
    this.headR = Math.min(this.width * 0.16, this.height * 0.075);
  }

  protected update(dt: number): void {
    this.time += dt;

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blink = 0.16;
      this.blinkTimer = 2.6 + Math.random() * 2.2;
    }
    this.blink = Math.max(0, this.blink - dt);
    this.react = Math.max(0, this.react - dt * 1.4);

    this.particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);

    ctx.save();
    ctx.translate(this.bunnyX, this.bunnyY);
    drawBunny(ctx, this.headR, this.outfit, this.blink > 0, this.react);
    ctx.restore();

    this.particles.draw(ctx);
  }

  protected onTap(): void {
    this.react = 1;
    sound.chime(Math.floor(Math.random() * 5));
    this.particles.burst(this.bunnyX, this.bunnyY - this.headR, {
      count: 8,
      colors: ['#ffe36e', '#ff9ecb', '#ffffff', '#a78bfa'],
      minSpeed: 40,
      maxSpeed: 140,
      life: 0.6,
      gravity: 150,
      size: 3,
    });
  }

  private buildWardrobe(host: HTMLElement): void {
    const wardrobe = document.createElement('div');
    wardrobe.className = 'wardrobe';

    const tabs = document.createElement('div');
    tabs.className = 'wardrobe__tabs';

    for (const category of CATEGORIES) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'wardrobe__tab';
      tab.textContent = category.icon;
      tab.setAttribute('aria-label', category.label);
      tab.addEventListener('click', () => {
        this.category = category.id;
        this.syncTabs();
        this.renderItems();
      });
      tabs.append(tab);
    }

    const items = document.createElement('div');
    items.className = 'wardrobe__items';

    wardrobe.append(tabs, items);
    host.append(wardrobe);

    this.wardrobe = wardrobe;
    this.tabsEl = tabs;
    this.itemsEl = items;

    this.syncTabs();
    this.renderItems();
  }

  private syncTabs(): void {
    if (!this.tabsEl) {
      return;
    }
    const buttons = this.tabsEl.querySelectorAll<HTMLButtonElement>(
      '.wardrobe__tab',
    );
    buttons.forEach((button, index) => {
      const category = CATEGORIES[index];
      button.classList.toggle(
        'is-active',
        category !== undefined && category.id === this.category,
      );
    });
  }

  private renderItems(): void {
    if (!this.itemsEl) {
      return;
    }

    this.itemsEl.replaceChildren();

    const items = ACCESSORIES.filter(
      (item) => item.category === this.category,
    );

    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wardrobe__item';
      button.classList.toggle(
        'is-active',
        this.outfit[this.category] === item.id,
      );
      button.setAttribute('aria-label', item.id);

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(32, 34);
        drawAccessory(ctx, item, 20);
      }

      button.append(canvas);
      button.addEventListener('click', () => this.equip(item));
      this.itemsEl.append(button);
    }
  }

  private equip(item: AccessoryDef): void {
    this.outfit[item.category] =
      this.outfit[item.category] === item.id ? null : item.id;

    this.react = 1;
    sound.pop(1);
    this.particles.burst(this.bunnyX, this.bunnyY - this.headR * 0.3, {
      count: 10,
      colors: [item.color, '#ffffff', '#ffe36e'],
      minSpeed: 40,
      maxSpeed: 150,
      life: 0.65,
      gravity: 140,
      size: 3.2,
    });

    this.renderItems();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const width = this.width;
    const height = this.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffe3f3');
    gradient.addColorStop(1, '#e3dcff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const spot = ctx.createRadialGradient(
      this.bunnyX,
      this.bunnyY,
      10,
      this.bunnyX,
      this.bunnyY,
      Math.min(width, height) * 0.55,
    );
    spot.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    spot.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(this.bunnyX, this.bunnyY, Math.min(width, height) * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(
      this.bunnyX,
      this.bunnyY + this.headR * 2.95,
      this.headR * 2.3,
      this.headR * 0.55,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    for (let index = 0; index < 9; index++) {
      const angle = (index / 9) * Math.PI * 2;
      const radius = Math.min(width, height) * (0.3 + (index % 3) * 0.07);
      const x = this.bunnyX + Math.cos(angle) * radius;
      const y = this.bunnyY + Math.sin(angle) * radius * 0.7;
      const twinkle = 0.4 + Math.abs(Math.sin(this.time * 1.5 + index)) * 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, 2 + (index % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBunny(
  ctx: CanvasRenderingContext2D,
  r: number,
  outfit: Outfit,
  blink: boolean,
  react: number,
): void {
  const bounce = Math.sin(react * Math.PI * 3) * r * 0.05;
  const earWiggle = Math.sin(react * Math.PI * 4) * 0.1;

  ctx.fillStyle = 'rgba(90, 60, 110, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, r * 2.98, r * 1.3, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, bounce);

  drawEar(ctx, -r * 0.42, -r * 1.02, -0.12 - earWiggle, r);
  drawEar(ctx, r * 0.42, -r * 1.02, 0.12 + earWiggle, r);

  ctx.fillStyle = '#fffdfd';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.7, r * 1.1, r * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 226, 240, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.9, r * 0.62, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffe2f0';
  ctx.beginPath();
  ctx.ellipse(-r * 0.55, r * 2.8, r * 0.42, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.55, r * 2.8, r * 0.42, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fffdfd';
  ctx.beginPath();
  ctx.ellipse(-r * 1.0, r * 1.6, r * 0.26, r * 0.42, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 1.0, r * 1.6, r * 0.26, r * 0.42, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fffdfd';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 220, 240, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.55, r * 0.72, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 140, 185, 0.5)';
  ctx.beginPath();
  ctx.arc(-r * 0.55, r * 0.22, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.55, r * 0.22, r * 0.16, 0, Math.PI * 2);
  ctx.fill();

  if (blink) {
    ctx.strokeStyle = '#4a2b5e';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.lineCap = 'round';
    for (const sx of [-0.3, 0.3]) {
      ctx.beginPath();
      ctx.arc(sx * r, -r * 0.05, r * 0.12, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#4a2b5e';
    for (const sx of [-0.3, 0.3]) {
      ctx.beginPath();
      ctx.arc(sx * r, -r * 0.05, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (const sx of [-0.3, 0.3]) {
      ctx.beginPath();
      ctx.arc(sx * r - r * 0.03, -r * 0.08, r * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#ff8fbf';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2, r * 0.1, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#4a2b5e';
  ctx.lineWidth = Math.max(1.4, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, r * 0.34, r * 0.16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  const sweater = findAccessory(outfit.sweater);
  if (sweater) {
    ctx.save();
    ctx.translate(0, r * 1.72);
    drawAccessory(ctx, sweater, r * 1.05);
    ctx.restore();
  }

  const shoes = findAccessory(outfit.shoes);
  if (shoes) {
    ctx.save();
    ctx.translate(0, r * 2.8);
    drawAccessory(ctx, shoes, r * 0.95);
    ctx.restore();
  }

  const gloves = findAccessory(outfit.gloves);
  if (gloves) {
    ctx.save();
    ctx.translate(0, r * 1.9);
    drawAccessory(ctx, gloves, r * 0.95);
    ctx.restore();
  }

  const scarf = findAccessory(outfit.scarf);
  if (scarf) {
    ctx.save();
    ctx.translate(0, r * 1.0);
    drawAccessory(ctx, scarf, r * 0.95);
    ctx.restore();
  }

  const glasses = findAccessory(outfit.glasses);
  if (glasses) {
    ctx.save();
    ctx.translate(0, -r * 0.05);
    drawAccessory(ctx, glasses, r * 0.9);
    ctx.restore();
  }

  const hat = findAccessory(outfit.hat);
  if (hat) {
    ctx.save();
    ctx.translate(0, -r * 0.88);
    drawAccessory(ctx, hat, r * 0.95);
    ctx.restore();
  }

  ctx.restore();
}

function drawEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tilt: number,
  r: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  ctx.fillStyle = '#fffdfd';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.5, r * 0.24, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffc7e0';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.5, r * 0.11, r * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawAccessory(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  switch (item.category) {
    case 'hat':
      drawHat(ctx, item, size);
      break;
    case 'scarf':
      drawScarf(ctx, item, size);
      break;
    case 'glasses':
      drawGlasses(ctx, item, size);
      break;
    case 'gloves':
      drawGloves(ctx, item, size);
      break;
    case 'sweater':
      drawSweater(ctx, item, size);
      break;
    case 'shoes':
      drawShoes(ctx, item, size);
      break;
  }
}

function drawHat(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  if (item.style === 'party') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(-size * 0.55, size * 0.3);
    ctx.lineTo(size * 0.55, size * 0.3);
    ctx.lineTo(0, -size * 0.95);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.34, size * 0.04);
    ctx.lineTo(size * 0.08, -size * 0.52);
    ctx.lineTo(size * 0.2, -size * 0.36);
    ctx.lineTo(-size * 0.2, size * 0.18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffe36e';
    ctx.beginPath();
    ctx.arc(0, -size * 1.0, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (item.style === 'beanie') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.75, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffdfd';
    ctx.beginPath();
    ctx.roundRect(-size * 0.82, size * 0.02, size * 1.64, size * 0.3, size * 0.15);
    ctx.fill();

    ctx.fillStyle = '#fffdfd';
    ctx.beginPath();
    ctx.arc(0, -size * 0.78, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (item.style === 'crown') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, size * 0.28);
    ctx.lineTo(-size * 0.7, -size * 0.28);
    ctx.lineTo(-size * 0.34, size * 0.02);
    ctx.lineTo(0, -size * 0.5);
    ctx.lineTo(size * 0.34, size * 0.02);
    ctx.lineTo(size * 0.7, -size * 0.28);
    ctx.lineTo(size * 0.7, size * 0.28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff6f91';
    ctx.beginPath();
    ctx.arc(0, -size * 0.12, size * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fc8ff';
    ctx.beginPath();
    ctx.arc(-size * 0.4, size * 0.06, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.4, size * 0.06, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.7, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-size * 0.7, 0, size * 1.4, size * 0.1);

  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.roundRect(size * 0.2, size * 0.02, size * 0.72, size * 0.2, size * 0.1);
  ctx.fill();

  ctx.fillStyle = '#fffdfd';
  ctx.beginPath();
  ctx.arc(0, -size * 0.72, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawScarf(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.roundRect(-size * 0.85, -size * 0.16, size * 1.7, size * 0.36, size * 0.16);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(size * 0.3, size * 0.08, size * 0.38, size * 0.92, size * 0.12);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.roundRect(-size * 0.6, -size * 0.05, size * 0.5, size * 0.1, size * 0.05);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(size * 0.36, size * 0.3, size * 0.26, size * 0.08, size * 0.04);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(size * 0.36, size * 0.54, size * 0.26, size * 0.08, size * 0.04);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = Math.max(1, size * 0.04);
  for (let index = 0; index < 3; index++) {
    ctx.beginPath();
    ctx.moveTo(size * (0.32 + index * 0.12), size * 0.96);
    ctx.lineTo(size * (0.32 + index * 0.12), size * 1.08);
    ctx.stroke();
  }
}

function drawGlasses(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  const lensX = size * 0.4;
  const lensY = 0;
  const lensSize = size * 0.3;

  ctx.strokeStyle = item.color;
  ctx.fillStyle = 'rgba(210, 240, 255, 0.5)';
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineCap = 'round';

  const shape = (x: number): void => {
    if (item.style === 'round') {
      ctx.beginPath();
      ctx.arc(x, lensY, lensSize, 0, Math.PI * 2);
    } else if (item.style === 'square') {
      ctx.beginPath();
      ctx.roundRect(
        x - lensSize,
        lensY - lensSize * 0.8,
        lensSize * 2,
        lensSize * 1.6,
        lensSize * 0.35,
      );
    } else if (item.style === 'heart') {
      ctx.beginPath();
      const s = lensSize;
      ctx.moveTo(x, lensY + s * 0.7);
      ctx.bezierCurveTo(x - s * 1.1, lensY - s * 0.1, x - s * 0.6, lensY - s * 0.95, x, lensY - s * 0.3);
      ctx.bezierCurveTo(x + s * 0.6, lensY - s * 0.95, x + s * 1.1, lensY - s * 0.1, x, lensY + s * 0.7);
      ctx.closePath();
    } else {
      ctx.beginPath();
      for (let index = 0; index < 10; index++) {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5;
        const radius = index % 2 === 0 ? lensSize : lensSize * 0.45;
        const px = x + Math.cos(angle) * radius;
        const py = lensY + Math.sin(angle) * radius;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  };

  shape(-lensX);
  shape(lensX);

  ctx.beginPath();
  ctx.moveTo(-lensX + lensSize * 0.9, lensY);
  ctx.lineTo(lensX - lensSize * 0.9, lensY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-lensX - lensSize, lensY);
  ctx.lineTo(-lensX - lensSize * 1.6, lensY - lensSize * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lensX + lensSize, lensY);
  ctx.lineTo(lensX + lensSize * 1.6, lensY - lensSize * 0.2);
  ctx.stroke();
}

function drawGloves(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  for (const side of [-1, 1]) {
    const x = side * size;

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(x, 0, size * 0.28, size * 0.42, side * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(
      x - side * size * 0.24,
      -size * 0.04,
      size * 0.1,
      size * 0.18,
      side * 0.45,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.roundRect(
      x - size * 0.28,
      size * 0.24,
      size * 0.56,
      size * 0.16,
      size * 0.08,
    );
    ctx.fill();
  }
}

function drawSweater(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  ctx.fillStyle = item.color;

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      side * size * 0.95,
      -size * 0.3,
      size * 0.3,
      size * 0.5,
      side * 0.25,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.beginPath();
  ctx.roundRect(
    -size * 0.95,
    -size * 0.9,
    size * 1.9,
    size * 1.75,
    size * 0.32,
  );
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.82, size * 0.55, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(
    -size * 0.85,
    size * 0.62,
    size * 1.7,
    size * 0.18,
    size * 0.09,
  );
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  const heart = size * 0.14;
  const heartY = -size * 0.08;
  ctx.beginPath();
  ctx.moveTo(0, heartY + heart * 0.8);
  ctx.bezierCurveTo(
    -heart * 1.2,
    heartY,
    -heart * 0.6,
    heartY - heart,
    0,
    heartY - heart * 0.3,
  );
  ctx.bezierCurveTo(
    heart * 0.6,
    heartY - heart,
    heart * 1.2,
    heartY,
    0,
    heartY + heart * 0.8,
  );
  ctx.fill();
}

function drawShoes(
  ctx: CanvasRenderingContext2D,
  item: AccessoryDef,
  size: number,
): void {
  for (const side of [-1, 1]) {
    const x = side * size * 0.58;

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(x, 0, size * 0.36, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(
      x + side * size * 0.12,
      -size * 0.05,
      size * 0.14,
      size * 0.08,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, size * 0.14, size * 0.36, size * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.12, -size * 0.02);
    ctx.lineTo(x + size * 0.12, -size * 0.02);
    ctx.stroke();
  }
}

export const dressupGame: GameDefinition = {
  id: 'dressup',
  title: 'Одень зайчика',
  icon: '🧥',
  colors: ['#ffb3d9', '#9b7bff'],
  create: () => new DressupGame(),
};
