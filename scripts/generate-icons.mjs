// Generates the PWA icons without any external image dependencies.
// Draws a soft smiling face on a pastel gradient using a tiny PNG encoder.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function roundedRectMask(x, y, radius) {
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - radius), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
}

// Returns [r, g, b, a] for a point in the unit square.
function shade(x, y, maskable) {
  if (!maskable && !roundedRectMask(x, y, 0.22)) {
    return [0, 0, 0, 0];
  }

  // Background gradient (pink -> lilac).
  let color = mix([255, 158, 203], [167, 139, 250], clamp01(y));

  // Face.
  const faceR = 0.3;
  const fdx = x - 0.5;
  const fdy = y - 0.5;
  const faceDist = Math.hypot(fdx, fdy);
  if (faceDist <= faceR) {
    color = [255, 252, 255];
  }

  const onFace = faceDist <= faceR;

  // Cheeks.
  const cheek = (cx, cy) => Math.hypot(x - cx, y - cy) <= 0.062;
  if (onFace && (cheek(0.335, 0.585) || cheek(0.665, 0.585))) {
    color = mix(color, [255, 130, 180], 0.7);
  }

  // Eyes.
  const eye = (cx, cy) => Math.hypot(x - cx, y - cy) <= 0.044;
  if (onFace && (eye(0.407, 0.463) || eye(0.593, 0.463))) {
    color = [74, 43, 94];
  }

  // Smile: a ring segment in the lower half of the face.
  const smileR = Math.hypot(fdx, fdy);
  const angle = Math.atan2(fdy, fdx);
  if (
    onFace &&
    smileR >= 0.135 &&
    smileR <= 0.168 &&
    angle >= 0.45 &&
    angle <= Math.PI - 0.45
  ) {
    color = [74, 43, 94];
  }

  return [Math.round(color[0]), Math.round(color[1]), Math.round(color[2]), 255];
}

function renderIcon(size, maskable) {
  const samples = 4;
  const big = size * samples;
  const hi = new Uint8ClampedArray(big * big * 4);

  for (let py = 0; py < big; py++) {
    const y = (py + 0.5) / big;
    for (let px = 0; px < big; px++) {
      const x = (px + 0.5) / big;
      const [r, g, b, a] = shade(x, y, maskable);
      const i = (py * big + px) * 4;
      hi[i] = r;
      hi[i + 1] = g;
      hi[i + 2] = b;
      hi[i + 3] = a;
    }
  }

  const out = Buffer.alloc(size * size * 4);
  const per = samples * samples;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const i = ((y * samples + sy) * big + (x * samples + sx)) * 4;
          r += hi[i];
          g += hi[i + 1];
          b += hi[i + 2];
          a += hi[i + 3];
        }
      }
      const o = (y * size + x) * 4;
      out[o] = r / per;
      out[o + 1] = g / per;
      out[o + 2] = b / per;
      out[o + 3] = a / per;
    }
  }

  return encodePng(size, size, out);
}

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-512-maskable.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

for (const { file, size, maskable } of targets) {
  const png = renderIcon(size, maskable);
  writeFileSync(join(outDir, file), png);
  console.log(`✓ ${file} (${size}x${size})`);
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff9ecb"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="256" cy="256" r="154" fill="#fffcfd"/>
  <circle cx="223" cy="237" r="23" fill="#4a2b5e"/>
  <circle cx="289" cy="237" r="23" fill="#4a2b5e"/>
  <circle cx="196" cy="300" r="32" fill="#ff82b4" opacity="0.7"/>
  <circle cx="316" cy="300" r="32" fill="#ff82b4" opacity="0.7"/>
  <path d="M203 292 Q256 348 309 292" fill="none" stroke="#4a2b5e" stroke-width="17" stroke-linecap="round"/>
</svg>
`;
writeFileSync(join(outDir, 'favicon.svg'), favicon);
console.log('✓ favicon.svg');
