import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/banners');
await mkdir(OUT_DIR, { recursive: true });

let clipCounter = 0;

function flower(cx, cy, size, color, center) {
  const petals = Array.from({ length: 5 }, (_, index) => {
    const angle = index * 72;
    return `<ellipse cx="${cx}" cy="${cy - size * 0.42}" rx="${size * 0.24}" ry="${size * 0.36}" fill="${color}" transform="rotate(${angle} ${cx} ${cy})"/>`;
  }).join('');
  return `<g>${petals}<circle cx="${cx}" cy="${cy}" r="${size * 0.17}" fill="${center}"/></g>`;
}

function paw(cx, cy, size, fill) {
  return `<g fill="${fill}">
    <ellipse cx="${cx - size * 0.38}" cy="${cy - size * 0.42}" rx="${size * 0.14}" ry="${size * 0.18}" transform="rotate(-25 ${cx - size * 0.38} ${cy - size * 0.42})"/>
    <ellipse cx="${cx - size * 0.12}" cy="${cy - size * 0.56}" rx="${size * 0.14}" ry="${size * 0.18}"/>
    <ellipse cx="${cx + size * 0.14}" cy="${cy - size * 0.56}" rx="${size * 0.14}" ry="${size * 0.18}"/>
    <ellipse cx="${cx + size * 0.4}" cy="${cy - size * 0.4}" rx="${size * 0.14}" ry="${size * 0.18}" transform="rotate(25 ${cx + size * 0.4} ${cy - size * 0.4})"/>
    <path d="M ${cx - size * 0.42} ${cy + size * 0.06} C ${cx - size * 0.42} ${cy + size * 0.46}, ${cx + size * 0.42} ${cy + size * 0.46}, ${cx + size * 0.42} ${cy + size * 0.06} C ${cx + size * 0.42} ${cy - size * 0.18}, ${cx - size * 0.42} ${cy - size * 0.18}, ${cx - size * 0.42} ${cy + size * 0.06} Z"/>
  </g>`;
}

function sparkle(cx, cy, size, fill, opacity = 1) {
  return `<path d="M ${cx} ${cy - size} Q ${cx + size * 0.15} ${cy - size * 0.15} ${cx + size} ${cy} Q ${cx + size * 0.15} ${cy + size * 0.15} ${cx} ${cy + size} Q ${cx - size * 0.15} ${cy + size * 0.15} ${cx - size} ${cy} Q ${cx - size * 0.15} ${cy - size * 0.15} ${cx} ${cy - size} Z" fill="${fill}" opacity="${opacity}"/>`;
}

function patternSvg(type, w, h, palette) {
  const parts = [];
  if (type === 'floral') {
    const spots = [
      [0.18, 0.17, 0.17],
      [0.64, 0.12, 0.13],
      [0.34, 0.33, 0.15],
      [0.73, 0.31, 0.12],
      [0.17, 0.53, 0.14],
      [0.52, 0.52, 0.17],
      [0.34, 0.72, 0.12],
      [0.7, 0.68, 0.16],
      [0.18, 0.86, 0.13],
      [0.55, 0.88, 0.12],
    ];
    for (const [px, py, ps] of spots) {
      const size = w * ps;
      parts.push(flower(px * w, py * h, size, palette.accent2, palette.accent));
      parts.push(
        `<ellipse cx="${px * w + size * 0.55}" cy="${py * h + size * 0.28}" rx="${size * 0.16}" ry="${size * 0.34}" fill="${palette.accent2}" opacity="0.55" transform="rotate(38 ${px * w + size * 0.55} ${py * h + size * 0.28})"/>`,
      );
    }
  }
  if (type === 'crystal') {
    parts.push(`<rect width="${w}" height="${h}" fill="${palette.accent2}" opacity="0.12"/>`);
    const spots = [
      [0.24, 0.2, 16],
      [0.68, 0.3, 11],
      [0.4, 0.48, 20],
      [0.77, 0.62, 13],
      [0.22, 0.7, 12],
      [0.56, 0.82, 17],
    ];
    for (const [px, py, size] of spots) {
      parts.push(sparkle(px * w, py * h, size, '#FFFFFF', 0.9));
    }
    parts.push(
      `<path d="M ${w * 0.1} ${h * 0.08} L ${w * 0.88} ${h * 0.44}" stroke="#FFFFFF" stroke-width="18" opacity="0.2" stroke-linecap="round"/>`,
    );
  }
  if (type === 'name') {
    parts.push(
      `<text x="${w / 2}" y="${h * 0.42}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${w * 0.23}" fill="${palette.accent}">seu nome</text>`,
      `<path d="M ${w * 0.2} ${h * 0.47} Q ${w * 0.5} ${h * 0.52} ${w * 0.8} ${h * 0.47}" fill="none" stroke="${palette.ink}" stroke-width="2" opacity="0.3"/>`,
      `<text x="${w / 2}" y="${h * 0.56}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${w * 0.045}" letter-spacing="${w * 0.02}" fill="${palette.ink}" opacity="0.65">SO SUA</text>`,
    );
    for (let i = 0; i < 9; i += 1) {
      const cx = w * (0.16 + ((i * 37) % 70) / 100);
      const cy = h * (0.66 + ((i * 23) % 22) / 100);
      parts.push(sparkle(cx, cy, 7 + (i % 3) * 2, palette.accent, 0.65));
    }
  }
  if (type === 'pets') {
    const spots = [
      [0.25, 0.2, 0.17],
      [0.67, 0.16, 0.13],
      [0.4, 0.4, 0.14],
      [0.76, 0.48, 0.16],
      [0.24, 0.62, 0.13],
      [0.55, 0.68, 0.17],
      [0.33, 0.86, 0.12],
      [0.72, 0.84, 0.14],
    ];
    for (const [px, py, ps] of spots) {
      parts.push(paw(px * w, py * h, w * ps, palette.ink));
    }
    for (let i = 0; i < 4; i += 1) {
      const x = w * (0.2 + i * 0.19);
      const y = h * (0.36 + (i % 2) * 0.4);
      parts.push(
        `<path d="M ${x} ${y + 10} C ${x - 20} ${y - 4}, ${x - 8} ${y - 20}, ${x} ${y - 9} C ${x + 8} ${y - 20}, ${x + 20} ${y - 4}, ${x} ${y + 10} Z" fill="${palette.accent2}" opacity="0.8"/>`,
      );
    }
  }
  if (type === 'waves') {
    for (let i = 0; i < 7; i += 1) {
      const y = h * 0.15 + i * h * 0.115;
      parts.push(
        `<path d="M ${-w * 0.05} ${y} q ${w * 0.16} ${-h * 0.07} ${w * 0.32} 0 t ${w * 0.32} 0 t ${w * 0.32} 0 t ${w * 0.32} 0" fill="none" stroke="${i % 2 === 0 ? palette.accent : palette.accent2}" stroke-width="${i % 2 === 0 ? 17 : 9}" stroke-linecap="round" opacity="${i % 2 === 0 ? 0.85 : 0.6}"/>`,
      );
    }
  }
  if (type === 'geo') {
    parts.push(
      `<path d="M 0 ${h * 0.6} A ${w * 0.5} ${w * 0.5} 0 0 1 ${w} ${h * 0.6} Z" fill="${palette.accent}" opacity="0.85"/>`,
    );
    for (let i = 0; i < 6; i += 1) {
      parts.push(
        `<circle cx="${w / 2}" cy="${h * 0.53}" r="${w * (0.08 + i * 0.065)}" fill="none" stroke="${palette.ink}" stroke-width="1.5" opacity="${0.34 - i * 0.03}"/>`,
      );
    }
    for (let i = 0; i < 8; i += 1) {
      const y = h * 0.69 + i * h * 0.035;
      parts.push(
        `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${palette.ink}" stroke-width="1" opacity="0.16"/>`,
      );
    }
  }
  return parts.join('');
}

function caseSvg({ x, y, w, h, rotate, palette, pattern }) {
  const id = `caseClip${++clipCounter}`;
  const rim = w * 0.028;
  const radius = w * 0.14;
  const cameraX = w * 0.085;
  const cameraY = h * 0.035;
  const cameraSize = w * 0.37;
  const lens = w * 0.062;
  const patternMarkup = patternSvg(pattern, w, h, palette);
  return `<g transform="translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})" filter="url(#productShadow)">
    <rect x="${-w * 0.045}" y="${-w * 0.045}" width="${w * 1.09}" height="${h + w * 0.09}" rx="${radius * 1.25}" fill="#FFFFFF" opacity="0.22"/>
    <rect width="${w}" height="${h}" rx="${radius}" fill="${palette.rim}"/>
    <rect x="${rim}" y="${rim}" width="${w - rim * 2}" height="${h - rim * 2}" rx="${radius * 0.88}" fill="${palette.case}"/>
    <clipPath id="${id}">
      <rect x="${rim}" y="${rim}" width="${w - rim * 2}" height="${h - rim * 2}" rx="${radius * 0.88}"/>
    </clipPath>
    <g clip-path="url(#${id})">
      ${patternMarkup}
      <rect x="${rim}" y="${rim}" width="${w - rim * 2}" height="${h - rim * 2}" fill="url(#caseGloss)"/>
    </g>
    <rect x="${cameraX}" y="${cameraY}" width="${cameraSize}" height="${cameraSize}" rx="${cameraSize * 0.24}" fill="${palette.case}" stroke="${palette.rim}" stroke-width="1.5"/>
    <circle cx="${cameraX + cameraSize * 0.3}" cy="${cameraY + cameraSize * 0.3}" r="${lens}" fill="#2E3639"/>
    <circle cx="${cameraX + cameraSize * 0.3}" cy="${cameraY + cameraSize * 0.3}" r="${lens * 0.52}" fill="#101719"/>
    <circle cx="${cameraX + cameraSize * 0.72}" cy="${cameraY + cameraSize * 0.3}" r="${lens}" fill="#2E3639"/>
    <circle cx="${cameraX + cameraSize * 0.72}" cy="${cameraY + cameraSize * 0.3}" r="${lens * 0.52}" fill="#101719"/>
    <circle cx="${cameraX + cameraSize * 0.3}" cy="${cameraY + cameraSize * 0.73}" r="${lens}" fill="#2E3639"/>
    <circle cx="${cameraX + cameraSize * 0.3}" cy="${cameraY + cameraSize * 0.73}" r="${lens * 0.52}" fill="#101719"/>
    <circle cx="${cameraX + cameraSize * 0.72}" cy="${cameraY + cameraSize * 0.73}" r="${lens * 0.32}" fill="#F8E6C8" opacity="0.9"/>
    <circle cx="${cameraX + cameraSize * 0.2}" cy="${cameraY + cameraSize * 0.2}" r="${lens * 0.2}" fill="#FFFFFF" opacity="0.5"/>
    <text x="${w / 2}" y="${h - h * 0.035}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${w * 0.038}" letter-spacing="${w * 0.012}" fill="${palette.ink}" opacity="0.45">LS</text>
  </g>`;
}

const palettes = {
  floral: { case: '#F8EEE9', rim: '#D9B7A7', ink: '#7A3E2B', accent: '#C75D29', accent2: '#E9B9A8' },
  crystal: { case: '#FFFFFF', rim: '#C9D2CF', ink: '#2E3639', accent: '#FFFFFF', accent2: '#A9C0B8' },
  name: { case: '#FAF2E8', rim: '#D4B9A2', ink: '#2E3639', accent: '#C75D29', accent2: '#C9A88D' },
  pets: { case: '#F9EFE4', rim: '#D3B69F', ink: '#4C382C', accent: '#C75D29', accent2: '#D9B79C' },
  waves: { case: '#F1D9C8', rim: '#CFA184', ink: '#5A2E1E', accent: '#C75D29', accent2: '#E8B696' },
  geo: { case: '#F8F1E8', rim: '#D5C2AC', ink: '#2E3639', accent: '#C75D29', accent2: '#D9B28F' },
};

function shell(viewBox, background, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${viewBox.split(' ')[2]}" height="${viewBox.split(' ')[3]}" role="img">
    <defs>
      <filter id="productShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#2E3639" flood-opacity="0.24"/>
      </filter>
      <linearGradient id="caseGloss" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.26"/>
        <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.02"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="${background}"/>
    ${body}
  </svg>`;
}

const banner1Desktop = shell(
  '0 0 1920 706',
  '#F6EAE3',
  `<g transform="translate(0 78)">
   <circle cx="1530" cy="285" r="300" fill="#E9B89E" opacity="0.55"/>
   <circle cx="1530" cy="285" r="355" fill="none" stroke="#2E3639" stroke-width="1.5" opacity="0.14"/>
   <circle cx="1050" cy="485" r="70" fill="#C75D29" opacity="0.12"/>
   <g opacity="0.55" fill="#2E3639">
     <circle cx="1040" cy="96" r="4"/><circle cx="1074" cy="96" r="4"/><circle cx="1108" cy="96" r="4"/>
     <circle cx="1040" cy="130" r="4"/><circle cx="1074" cy="130" r="4"/><circle cx="1108" cy="130" r="4"/>
   </g>
   ${caseSvg({ x: 1125, y: 62, w: 255, h: 435, rotate: -5, palette: palettes.crystal, pattern: 'crystal' })}
   ${caseSvg({ x: 1452, y: 92, w: 238, h: 415, rotate: 7, palette: palettes.floral, pattern: 'floral' })}
   </g>`,
);

const banner1Mobile = shell(
  '0 0 900 760',
  '#F6EAE3',
  `<circle cx="700" cy="470" r="270" fill="#E9B89E" opacity="0.55"/>
   <circle cx="700" cy="470" r="310" fill="none" stroke="#2E3639" stroke-width="1.4" opacity="0.14"/>
   <circle cx="800" cy="90" r="55" fill="#C75D29" opacity="0.12"/>
   ${caseSvg({ x: 322, y: 330, w: 235, h: 400, rotate: -4, palette: palettes.crystal, pattern: 'crystal' })}
   ${caseSvg({ x: 590, y: 362, w: 205, h: 352, rotate: 8, palette: palettes.floral, pattern: 'floral' })}`,
);

const banner2Desktop = shell(
  '0 0 1920 706',
  '#2E3639',
  `<g transform="translate(0 78)">
   <circle cx="1535" cy="275" r="305" fill="#C75D29" opacity="0.92"/>
   <circle cx="1535" cy="275" r="360" fill="none" stroke="#F8F4EE" stroke-width="1.3" opacity="0.18"/>
   <circle cx="1535" cy="275" r="395" fill="none" stroke="#F8F4EE" stroke-width="1" opacity="0.08"/>
   <g fill="#E9A27D" opacity="0.5">
     <circle cx="1080" cy="96" r="4"/><circle cx="1112" cy="96" r="4"/><circle cx="1144" cy="96" r="4"/>
     <circle cx="1080" cy="128" r="4"/><circle cx="1112" cy="128" r="4"/><circle cx="1144" cy="128" r="4"/>
   </g>
   ${caseSvg({ x: 1118, y: 66, w: 255, h: 435, rotate: 4, palette: palettes.pets, pattern: 'pets' })}
   ${caseSvg({ x: 1450, y: 104, w: 232, h: 405, rotate: -8, palette: palettes.name, pattern: 'name' })}
   </g>`,
);

const banner2Mobile = shell(
  '0 0 900 760',
  '#2E3639',
  `<circle cx="710" cy="465" r="270" fill="#C75D29" opacity="0.92"/>
   <circle cx="710" cy="465" r="312" fill="none" stroke="#F8F4EE" stroke-width="1.2" opacity="0.15"/>
   ${caseSvg({ x: 328, y: 328, w: 235, h: 400, rotate: 4, palette: palettes.pets, pattern: 'pets' })}
   ${caseSvg({ x: 590, y: 365, w: 205, h: 350, rotate: -8, palette: palettes.name, pattern: 'name' })}`,
);

const banner3Desktop = shell(
  '0 0 1920 706',
  '#F8F4EE',
  `<rect x="1080" y="0" width="840" height="78" fill="#C75D29"/>
   <rect x="1080" y="628" width="840" height="78" fill="#C75D29"/>
   <g transform="translate(0 78)">
   <path d="M 1080 0 H 1920 V 550 H 1080 C 1190 370 1190 180 1080 0 Z" fill="#C75D29"/>
   <circle cx="1535" cy="273" r="300" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.2"/>
   <circle cx="1535" cy="273" r="350" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.1"/>
   <circle cx="1050" cy="480" r="68" fill="#C75D29" opacity="0.1"/>
   <g opacity="0.35" fill="#2E3639">
     <circle cx="1010" cy="96" r="4"/><circle cx="1044" cy="96" r="4"/><circle cx="1078" cy="96" r="4"/>
     <circle cx="1010" cy="130" r="4"/><circle cx="1044" cy="130" r="4"/><circle cx="1078" cy="130" r="4"/>
   </g>
   ${caseSvg({ x: 1165, y: 66, w: 255, h: 435, rotate: -4, palette: palettes.geo, pattern: 'geo' })}
   ${caseSvg({ x: 1495, y: 100, w: 232, h: 405, rotate: 8, palette: palettes.waves, pattern: 'waves' })}
   </g>`,
);

const banner3Mobile = shell(
  '0 0 900 760',
  '#F8F4EE',
  `<path d="M 0 425 C 210 375 480 375 900 420 V 760 H 0 Z" fill="#C75D29"/>
   <circle cx="700" cy="230" r="200" fill="none" stroke="#C75D29" stroke-width="1.5" opacity="0.18"/>
   <circle cx="700" cy="230" r="240" fill="none" stroke="#2E3639" stroke-width="1" opacity="0.08"/>
   <circle cx="770" cy="110" r="48" fill="#C75D29" opacity="0.12"/>
   ${caseSvg({ x: 305, y: 345, w: 230, h: 390, rotate: -4, palette: palettes.geo, pattern: 'geo' })}
   ${caseSvg({ x: 575, y: 378, w: 202, h: 345, rotate: 8, palette: palettes.waves, pattern: 'waves' })}`,
);

const banners = [
  ['banner-estilo-desktop.svg', banner1Desktop],
  ['banner-estilo-mobile.svg', banner1Mobile],
  ['banner-personalize-desktop.svg', banner2Desktop],
  ['banner-personalize-mobile.svg', banner2Mobile],
  ['banner-compativel-desktop.svg', banner3Desktop],
  ['banner-compativel-mobile.svg', banner3Mobile],
];

for (const [name, content] of banners) {
  await writeFile(path.join(OUT_DIR, name), content);
}

console.log(`Generated ${banners.length} banner images in ${OUT_DIR}`);
