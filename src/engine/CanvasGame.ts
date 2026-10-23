import type { GameInstance } from '../types';

/**
 * Reusable canvas game shell: DPR-aware resize, requestAnimationFrame loop,
 * pointer taps in CSS pixels, cleanup and visibility handling.
 */
export abstract class CanvasGame implements GameInstance {
  protected host: HTMLElement | null = null;
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;

  protected width = 0;
  protected height = 0;
  protected dpr = 1;

  private frame = 0;
  private lastTime = 0;
  private observer: ResizeObserver | null = null;

  mount(host: HTMLElement): void {
    this.host = host;

    const canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    host.append(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    host.addEventListener('pointerdown', this.handlePointerDown);
    document.addEventListener('visibilitychange', this.handleVisibility);

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();

    this.onMount();

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.observer = null;

    this.host?.removeEventListener('pointerdown', this.handlePointerDown);
    document.removeEventListener('visibilitychange', this.handleVisibility);

    this.onDestroy();
    this.host?.replaceChildren();

    this.host = null;
    this.canvas = null;
    this.ctx = null;
  }

  /** Called after size and context are ready. */
  protected onMount(): void {}

  /** Called before the host is cleared. */
  protected onDestroy(): void {}

  protected abstract update(dt: number): void;
  protected abstract draw(ctx: CanvasRenderingContext2D): void;

  /** Tap coordinates are in CSS pixels relative to the canvas. */
  protected onTap(_x: number, _y: number): void {}

  protected onResize(): void {}

  private handleVisibility = (): void => {
    if (!document.hidden) {
      this.lastTime = performance.now();
    }
  };

  private loop = (time: number): void => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (!document.hidden) {
      this.update(dt);
      const ctx = this.ctx;
      if (ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        this.draw(ctx);
      }
    }

    this.frame = requestAnimationFrame(this.loop);
  };

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
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.onResize();
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    event.preventDefault();

    const rect = this.canvas?.getBoundingClientRect();
    const x = rect ? event.clientX - rect.left : 0;
    const y = rect ? event.clientY - rect.top : 0;
    this.onTap(x, y);
  };
}
