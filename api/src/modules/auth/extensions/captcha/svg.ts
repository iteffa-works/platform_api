/** SVG-капча: темні символи на світлому тлі */

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

const FILLS = ['#1a1d21', '#1f4e79', '#3d4a5c', '#1f6fb2', '#4a5568'] as const;

/** Згенерувати SVG-зображення для коду */
export function renderCaptchaSvg(code: string): string {
  const width = 200;
  const height = 36;
  const chars = [...code];
  const gap = 30;
  const total = (chars.length - 1) * gap;
  const startX = (width - total) / 2;

  const noise = Array.from({ length: 3 }, (_, i) => {
    const y1 = rand(6, height - 6).toFixed(1);
    const y2 = rand(6, height - 6).toFixed(1);
    const op = (0.12 + i * 0.04).toFixed(2);
    return `<path d="M${rand(8, 24).toFixed(1)} ${y1} Q${(width / 2).toFixed(1)} ${rand(4, height - 4).toFixed(1)} ${rand(width - 24, width - 8).toFixed(1)} ${y2}" fill="none" stroke="#b8c0cc" stroke-width="1" opacity="${op}"/>`;
  }).join('');

  const dots = Array.from({ length: 8 }, () => {
    const cx = rand(10, width - 10).toFixed(1);
    const cy = rand(4, height - 4).toFixed(1);
    return `<circle cx="${cx}" cy="${cy}" r="0.8" fill="#b8c0cc" opacity="0.7"/>`;
  }).join('');

  const letters = chars
    .map((char, index) => {
      const x = startX + index * gap;
      const y = (height / 2 + rand(-2, 2)).toFixed(1);
      const rotate = rand(-8, 8).toFixed(1);
      const fill = FILLS[index % FILLS.length];
      return `<text x="${x.toFixed(1)}" y="${y}" fill="${fill}" font-family="ui-monospace, Cascadia Code, Consolas, monospace" font-size="18" font-weight="600" letter-spacing="0.04em" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotate} ${x.toFixed(1)} ${y})">${escapeXml(char)}</text>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>`
    + `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<rect width="100%" height="100%" fill="transparent"/>`
    + noise
    + dots
    + letters
    + `</svg>`;
}
