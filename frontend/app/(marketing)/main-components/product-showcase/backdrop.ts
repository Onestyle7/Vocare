import { type ProductFeatureId, productFeatures } from './data';

// [x, y, width, height] in percent of one feature's field, then the glow color.
type Glow = readonly [number, number, number, number, string];

// One glowing field per feature on the dark page: a deep tinted base with light sources in the
// feature's color. The fields sit side by side on a track that slides to the active feature, so
// neighbouring colors sweep through the stage while the tabs change.
const fields: Record<ProductFeatureId, { base: string; glows: readonly Glow[] }> = {
  direction: {
    base: '#10121f',
    glows: [
      [38, 22, 34, 58, '#4a57d8'],
      [4, 50, 24, 56, '#5a3fb8'],
      [12, 90, 28, 46, '#1d5f91'],
      [44, 98, 30, 40, '#2f3da0'],
      [80, 92, 32, 46, '#155a70'],
      [86, 10, 34, 46, '#2b2f70'],
      [98, 56, 20, 50, '#1c4b6e'],
    ],
  },
  market: {
    base: '#0c1719',
    glows: [
      [36, 24, 34, 58, '#128a82'],
      [6, 22, 24, 50, '#1a566e'],
      [12, 88, 28, 46, '#0e6b64'],
      [60, 96, 30, 40, '#137169'],
      [84, 14, 32, 46, '#23604a'],
      [86, 84, 32, 46, '#1c4a85'],
    ],
  },
  roadmap: {
    base: '#130f26',
    glows: [
      [38, 24, 34, 58, '#6344cf'],
      [6, 24, 24, 50, '#43349e'],
      [10, 84, 28, 46, '#2d43a3'],
      [52, 96, 30, 40, '#5335b5'],
      [86, 14, 32, 46, '#352a70'],
      [84, 84, 32, 46, '#7a3890'],
    ],
  },
  resume: {
    base: '#1a0f1f',
    glows: [
      [38, 24, 34, 58, '#9a3a93'],
      [6, 24, 24, 50, '#552a72'],
      [10, 86, 28, 46, '#45359c'],
      [52, 96, 30, 40, '#a14176'],
      [86, 14, 32, 46, '#6e3450'],
      [84, 84, 32, 46, '#8f3565'],
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
