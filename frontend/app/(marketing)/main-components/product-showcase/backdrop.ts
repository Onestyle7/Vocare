import { type ProductFeatureId, productFeatures } from './data';

// [x, y, width, height] in percent of one feature's field, then the glow color.
type Glow = readonly [number, number, number, number, string];

// One soft color field per feature. The fields sit side by side on a track that slides to the
// active feature, so neighbouring colors sweep through the stage while the tabs change.
const fields: Record<ProductFeatureId, { base: string; glows: readonly Glow[] }> = {
  direction: {
    base: '#bcd6f5',
    glows: [
      [38, 26, 34, 58, '#4f86de'],
      [4, 48, 24, 56, '#cfc5f5'],
      [10, 88, 28, 46, '#bdeefa'],
      [42, 98, 30, 40, '#80abe6'],
      [80, 90, 32, 46, '#96e1d2'],
      [86, 10, 34, 46, '#eef6fc'],
      [98, 56, 20, 50, '#b4e7ea'],
    ],
  },
  market: {
    base: '#bfeee8',
    glows: [
      [36, 28, 34, 58, '#34c8bd'],
      [6, 22, 24, 50, '#c9f1f6'],
      [12, 86, 28, 46, '#93e3d8'],
      [60, 96, 30, 40, '#7fd6cc'],
      [84, 14, 32, 46, '#f1f8d8'],
      [86, 84, 32, 46, '#a9d0f6'],
    ],
  },
  roadmap: {
    base: '#dcd3f9',
    glows: [
      [38, 28, 34, 58, '#9a80e6'],
      [6, 24, 24, 50, '#ccbdf7'],
      [10, 82, 28, 46, '#a9c8f7'],
      [52, 96, 30, 40, '#b59df0'],
      [86, 14, 32, 46, '#f3eefd'],
      [84, 84, 32, 46, '#f1b8ee'],
    ],
  },
  resume: {
    base: '#f5d5f3',
    glows: [
      [38, 28, 34, 58, '#e27fdd'],
      [6, 24, 24, 50, '#fbe4f8'],
      [10, 84, 28, 46, '#d2c3fa'],
      [52, 96, 30, 40, '#ee9fe4'],
      [86, 14, 32, 46, '#fff2d6'],
      [84, 84, 32, 46, '#fbc6da'],
    ],
  },
};

const count = productFeatures.length;

// The fields are soft enough to paint at low resolution: the GPU only stretches this small
// texture, where CSS gradients would be shaded per screen pixel on every animation frame.
export const BACKDROP_WIDTH = 384 * count;
export const BACKDROP_HEIGHT = 240;

// Returns whether the canvas was painted and can replace the fallback color.
export function paintBackdrop(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return false;
  const { width, height } = canvas;
  const fieldWidth = width / count;

  const base = context.createLinearGradient(0, 0, width, 0);
  productFeatures.forEach(({ id }, field) => {
    base.addColorStop((field + 0.5) / count, fields[id].base);
  });
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  // Eased alpha stops read like a blurred blob. Earlier glows are painted last, on top.
  const glows = productFeatures.flatMap(({ id }, field) =>
    fields[id].glows.map((glow) => ({ glow, field }))
  );
  for (const {
    glow: [x, y, glowWidth, glowHeight, color],
    field,
  } of glows.reverse()) {
    context.save();
    context.translate((field + x / 100) * fieldWidth, (y / 100) * height);
    context.scale((glowWidth / 100) * fieldWidth, (glowHeight / 100) * height);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.3, `${color}b3`);
    gradient.addColorStop(0.62, `${color}40`);
    gradient.addColorStop(1, `${color}00`);
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }

  // Canvas gradients are not dithered; stretched, their 8-bit steps show as bands. A little
  // noise, added once, breaks them up.
  const image = context.getImageData(0, 0, width, height);
  const { data } = image;
  for (let pixel = 0; pixel < data.length; pixel += 4) {
    const noise = (Math.random() - 0.5) * 2;
    data[pixel] += noise;
    data[pixel + 1] += noise;
    data[pixel + 2] += noise;
  }
  context.putImageData(image, 0, 0);
  return true;
}
