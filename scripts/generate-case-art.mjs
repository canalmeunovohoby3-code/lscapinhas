import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/cases');
await mkdir(OUT_DIR, { recursive: true });

const products = [
  {
    slug: 'flor-de-cerejeira',
    pattern: 'floral',
    palette: { bg: '#F6EAE4', case: '#F8EEE9', rim: '#D9B7A7', ink: '#7A3E2B', accent: '#C75D29', accent2: '#E9B9A8' },
  },
  {
    slug: 'minimal-off-white',
    pattern: 'minimal',
    palette: { bg: '#F3F0EB', case: '#EFEAE2', rim: '#DAD2C6', ink: '#2E3639', accent: '#C75D29', accent2: '#C9BFB1' },
  },
  {
    slug: 'cristal-transparente',
    pattern: 'transparent',
    palette: { bg: '#EEF1F0', case: '#FFFFFF', rim: '#C9D2CF', ink: '#2E3639', accent: '#FFFFFF', accent2: '#A9C0B8' },
  },
  {
    slug: 'ondas-terracota',
    pattern: 'waves',
    palette: { bg: '#F4E6DC', case: '#F1D9C8', rim: '#CFA184', ink: '#5A2E1E', accent: '#C75D29', accent2: '#E8B696' },
  },
  {
    slug: 'tartaruga-ambar',
    pattern: 'tortoise',
    palette: { bg: '#F3EADF', case: '#E9D6BD', rim: '#B98D5D', ink: '#4A2E18', accent: '#8A5124', accent2: '#D7A96F' },
  },
  {
    slug: 'estrelas-doce',
    pattern: 'stars',
    palette: { bg: '#F5EFE9', case: '#F7E7DC', rim: '#DDBBA4', ink: '#5C3527', accent: '#C75D29', accent2: '#E9C9A8' },
  },
  {
    slug: 'xadrez-retro',
    pattern: 'checker',
    palette: { bg: '#F2EDE7', case: '#F6EDE2', rim: '#CCB49B', ink: '#2E3639', accent: '#C75D29', accent2: '#D9C4AE' },
  },
  {
    slug: 'folhagem-tropical',
    pattern: 'leaves',
    palette: { bg: '#EEF0E7', case: '#E7EBDD', rim: '#B5BFA4', ink: '#334034', accent: '#7C8A5A', accent2: '#C75D29' },
  },
  {
    slug: 'aquarela-outono',
    pattern: 'watercolor',
    palette: { bg: '#F4EAE2', case: '#FAF3EC', rim: '#DCC9B8', ink: '#5C3A2A', accent: '#C75D29', accent2: '#D9A38B' },
  },
  {
    slug: 'frase-viva-o-agora',
    pattern: 'phrase',
    palette: { bg: '#F2E9DF', case: '#FBF4EA', rim: '#D6BFA9', ink: '#2E3639', accent: '#C75D29', accent2: '#B79B7E' },
  },
  {
    slug: 'patinhas-e-cores',
    pattern: 'pets',
    palette: { bg: '#F5EDE5', case: '#F9EFE4', rim: '#D3B69F', ink: '#4C382C', accent: '#C75D29', accent2: '#D9B79C' },
  },
  {
    slug: 'blobs-pastel',
    pattern: 'blobs',
    palette: { bg: '#F4EDE6', case: '#FBF4EC', rim: '#D8C2AE', ink: '#4A3A2E', accent: '#C75D29', accent2: '#E3BFA7' },
  },
  {
    slug: 'geometrica-sunrise',
    pattern: 'geo',
    palette: { bg: '#F2ECE5', case: '#F8F1E8', rim: '#D5C2AC', ink: '#2E3639', accent: '#C75D29', accent2: '#D9B28F' },
  },
  {
    slug: 'sorrisos',
    pattern: 'smileys',
    palette: { bg: '#F6EEE4', case: '#FBEFD9', rim: '#DCBB94', ink: '#4A3827', accent: '#C75D29', accent2: '#E6C79D' },
  },
  {
    slug: 'seu-nome',
    pattern: 'name',
    palette: { bg: '#F2E9E1', case: '#FAF2E8', rim: '#D4B9A2', ink: '#2E3639', accent: '#C75D29', accent2: '#C9A88D' },
  },
  {
    slug: 'ceu-estrelado',
    pattern: 'night',
    palette: { bg: '#E9E5DF', case: '#2E3639', rim: '#1F2628', ink: '#F8F1E6', accent: '#E2A778', accent2: '#C75D29' },
  },
];

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const range = (random, min, max) => min + random() * (max - min);

function star(cx, cy, outer, inner, fill, opacity = 1) {
  const points = [];
  for (let i = 0; i < 8; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${fill}" opacity="${opacity}"/>`;
}

function flower(cx, cy, size, rotation, palette, opacity = 1) {
  const petals = Array.from({ length: 5 }, (_, index) => {
    const angle = rotation + (index * 360) / 5;
    return `<ellipse cx="${cx}" cy="${cy - size * 0.44}" rx="${size * 0.26}" ry="${size * 0.4}" fill="${palette.accent2}" opacity="0.92" transform="rotate(${angle} ${cx} ${cy})"/>`;
  }).join('');
  return `<g opacity="${opacity}">${petals}<circle cx="${cx}" cy="${cy}" r="${size * 0.19}" fill="${palette.accent}"/></g>`;
}

function leaf(cx, cy, size, rotation, fill, opacity = 1) {
  return `<g transform="rotate(${rotation} ${cx} ${cy})" opacity="${opacity}"><ellipse cx="${cx}" cy="${cy}" rx="${size * 0.22}" ry="${size * 0.52}" fill="${fill}"/><line x1="${cx}" y1="${cy - size * 0.38}" x2="${cx}" y2="${cy + size * 0.38}" stroke="${fill}" stroke-width="1" opacity="0.5"/></g>`;
}

function paw(cx, cy, size, fill, opacity = 1) {
  const toes = [
    [-0.42, -0.44],
    [-0.15, -0.6],
    [0.15, -0.6],
    [0.42, -0.44],
  ]
    .map(([dx, dy]) => `<ellipse cx="${cx + dx * size}" cy="${cy + dy * size}" rx="${size * 0.15}" ry="${size * 0.2}" fill="${fill}" transform="rotate(${dx * 30} ${cx + dx * size} ${cy + dy * size})"/>`)
    .join('');
  return `<g opacity="${opacity}">${toes}<path d="M ${cx - size * 0.45} ${cy + size * 0.05} C ${cx - size * 0.45} ${cy + size * 0.48}, ${cx + size * 0.45} ${cy + size * 0.48}, ${cx + size * 0.45} ${cy + size * 0.05} C ${cx + size * 0.45} ${cy - size * 0.2}, ${cx - size * 0.45} ${cy - size * 0.2}, ${cx - size * 0.45} ${cy + size * 0.05} Z" fill="${fill}"/></g>`;
}

function smiley(cx, cy, size, palette, opacity = 1) {
  return `<g opacity="${opacity}" transform="rotate(${range(rand, -18, 18)} ${cx} ${cy})">
    <circle cx="${cx}" cy="${cy}" r="${size}" fill="${palette.accent2}"/>
    <circle cx="${cx - size * 0.34}" cy="${cy - size * 0.18}" r="${size * 0.09}" fill="${palette.ink}"/>
    <circle cx="${cx + size * 0.34}" cy="${cy - size * 0.18}" r="${size * 0.09}" fill="${palette.ink}"/>
    <path d="M ${cx - size * 0.42} ${cy + size * 0.22} Q ${cx} ${cy + size * 0.62} ${cx + size * 0.42} ${cy + size * 0.22}" fill="none" stroke="${palette.ink}" stroke-width="${Math.max(2, size * 0.08)}" stroke-linecap="round"/>
  </g>`;
}

let rand = Math.random;

function renderPattern(pattern, palette, slug) {
  const random = mulberry32(hashString(slug));
  rand = random;
  const left = 242;
  const right = 658;
  const top = 124;
  const bottom = 976;
  const parts = [];
  const width = right - left;

  if (pattern === 'floral') {
    for (let i = 0; i < 15; i += 1) {
      const cx = range(random, left + 50, right - 50);
      const cy = range(random, top + 60, bottom - 50);
      const size = range(random, 34, 62);
      parts.push(leaf(cx + range(random, -34, 34), cy + range(random, -20, 30), size * 0.9, range(random, -70, 70), palette.accent2, 0.6));
      parts.push(flower(cx, cy, size, range(random, 0, 70), palette, range(random, 0.65, 1)));
    }
  }

  if (pattern === 'minimal') {
    parts.push(`<circle cx="${right - 30}" cy="${top + 210}" r="190" fill="none" stroke="${palette.ink}" stroke-width="1.6" opacity="0.35"/>`);
    parts.push(`<circle cx="${left + 40}" cy="${bottom - 180}" r="130" fill="none" stroke="${palette.accent}" stroke-width="1.6" opacity="0.45"/>`);
    parts.push(`<path d="M ${left + 30} ${top + 330} Q ${left + 230} ${top + 240} ${right - 40} ${top + 300}" fill="none" stroke="${palette.ink}" stroke-width="1.4" opacity="0.3"/>`);
    for (let i = 0; i < 12; i += 1) {
      parts.push(`<circle cx="${range(random, left + 30, right - 30)}" cy="${range(random, top + 40, bottom - 40)}" r="3.2" fill="${palette.ink}" opacity="0.4"/>`);
    }
  }

  if (pattern === 'transparent') {
    parts.push(`<rect x="${left + 18}" y="${top + 18}" width="${width - 36}" height="${bottom - top - 36}" rx="62" fill="${palette.accent2}" opacity="0.16"/>`);
    for (let i = 0; i < 7; i += 1) {
      const x = range(random, left + 40, right - 40);
      const y = range(random, top + 50, bottom - 50);
      const r = range(random, 10, 24);
      parts.push(star(x, y, r, r * 0.22, '#FFFFFF', 0.95));
    }
    parts.push(`<path d="M ${left + 70} ${top + 60} L ${right - 40} ${top + 420}" stroke="#FFFFFF" stroke-width="18" opacity="0.22" stroke-linecap="round"/>`);
    parts.push(`<path d="M ${left + 120} ${bottom - 40} L ${right - 20} ${top + 560}" stroke="#FFFFFF" stroke-width="7" opacity="0.3" stroke-linecap="round"/>`);
  }

  if (pattern === 'waves') {
    for (let i = 0; i < 9; i += 1) {
      const y = top + 80 + i * 98;
      const color = i % 2 === 0 ? palette.accent : palette.accent2;
      parts.push(`<path d="M ${left - 20} ${y} q 70 -54 140 0 t 140 0 t 140 0 t 140 0" fill="none" stroke="${color}" stroke-width="${i % 2 === 0 ? 16 : 8}" stroke-linecap="round" opacity="${i % 2 === 0 ? 0.8 : 0.65}"/>`);
    }
  }

  if (pattern === 'tortoise') {
    parts.push(`<rect x="${left}" y="${top}" width="${width}" height="${bottom - top}" fill="${palette.accent2}" opacity="0.18"/>`);
    for (let i = 0; i < 20; i += 1) {
      const cx = range(random, left + 30, right - 30);
      const cy = range(random, top + 30, bottom - 30);
      const rx = range(random, 30, 78);
      const ry = range(random, 26, 64);
      parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${i % 3 === 0 ? palette.ink : palette.accent}" opacity="${range(random, 0.2, 0.5)}" transform="rotate(${range(random, 0, 180)} ${cx} ${cy})"/>`);
      parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.55}" ry="${ry * 0.55}" fill="none" stroke="${palette.rim}" stroke-width="1.2" opacity="0.5" transform="rotate(${range(random, 0, 180)} ${cx} ${cy})"/>`);
    }
  }

  if (pattern === 'stars') {
    for (let i = 0; i < 26; i += 1) {
      const cx = range(random, left + 26, right - 26);
      const cy = range(random, top + 40, bottom - 30);
      const size = range(random, 7, 20);
      parts.push(star(cx, cy, size, size * 0.26, i % 4 === 0 ? palette.accent : palette.ink, range(random, 0.45, 0.9)));
    }
    for (let i = 0; i < 18; i += 1) {
      parts.push(`<circle cx="${range(random, left + 20, right - 20)}" cy="${range(random, top + 30, bottom - 30)}" r="2.4" fill="${palette.accent}" opacity="0.55"/>`);
    }
  }

  if (pattern === 'checker') {
    const cell = 69;
    for (let row = 0; row * cell < bottom - top; row += 1) {
      for (let col = 0; col * cell < width; col += 1) {
        if ((row + col) % 2 === 0) {
          parts.push(`<rect x="${left + col * cell}" y="${top + row * cell}" width="${cell}" height="${cell}" fill="${palette.accent}" opacity="0.82"/>`);
        } else {
          parts.push(`<rect x="${left + col * cell}" y="${top + row * cell}" width="${cell}" height="${cell}" fill="${palette.accent2}" opacity="0.5"/>`);
        }
      }
    }
  }

  if (pattern === 'leaves') {
    for (let i = 0; i < 16; i += 1) {
      const cx = range(random, left + 30, right - 30);
      const cy = range(random, top + 40, bottom - 40);
      parts.push(leaf(cx, cy, range(random, 70, 130), range(random, 0, 180), i % 3 === 0 ? palette.accent2 : palette.accent, range(random, 0.35, 0.8)));
    }
  }

  if (pattern === 'watercolor') {
    for (let i = 0; i < 12; i += 1) {
      const cx = range(random, left + 40, right - 40);
      const cy = range(random, top + 60, bottom - 40);
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${range(random, 70, 140)}" fill="${i % 2 === 0 ? palette.accent : palette.accent2}" opacity="${range(random, 0.18, 0.36)}" filter="url(#paintBlur)"/>`);
    }
    for (let i = 0; i < 6; i += 1) {
      parts.push(leaf(range(random, left + 30, right - 30), range(random, top + 60, bottom - 40), 70, range(random, 0, 180), palette.ink, 0.28));
    }
  }

  if (pattern === 'phrase') {
    parts.push(`<text x="${left + width / 2}" y="${top + 300}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="118" fill="${palette.accent}" transform="rotate(-8 ${left + width / 2} ${top + 300})">viva</text>`);
    parts.push(`<text x="${left + width / 2}" y="${top + 420}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="96" fill="${palette.ink}" transform="rotate(-8 ${left + width / 2} ${top + 420})">o agora.</text>`);
    for (let i = 0; i < 10; i += 1) {
      const cx = range(random, left + 40, right - 40);
      const cy = range(random, top + 480, bottom - 80);
      parts.push(i % 2 === 0 ? star(cx, cy, 9, 3, palette.accent, 0.8) : `<circle cx="${cx}" cy="${cy}" r="3" fill="${palette.ink}" opacity="0.35"/>`);
    }
    parts.push(`<path d="M ${left + 80} ${bottom - 150} q 60 -40 120 0 q 50 30 100 -10" fill="none" stroke="${palette.accent2}" stroke-width="2" opacity="0.6"/>`);
  }

  if (pattern === 'name') {
    parts.push(`<text x="${left + width / 2}" y="${top + 300}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="104" fill="${palette.accent}">seu nome</text>`);
    parts.push(`<path d="M ${left + 105} ${top + 340} q 60 18 120 0 t 120 0" fill="none" stroke="${palette.ink}" stroke-width="2" opacity="0.35"/>`);
    parts.push(`<text x="${left + width / 2}" y="${top + 410}" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="20" letter-spacing="10" fill="${palette.ink}" opacity="0.7">SÓ SUA</text>`);
    for (let i = 0; i < 8; i += 1) {
      parts.push(star(range(random, left + 40, right - 40), range(random, top + 470, bottom - 70), range(random, 5, 12), 2, palette.accent, 0.6));
    }
  }

  if (pattern === 'pets') {
    for (let i = 0; i < 11; i += 1) {
      const cx = range(random, left + 50, right - 50);
      const cy = range(random, top + 60, bottom - 50);
      parts.push(paw(cx, cy, range(random, 34, 58), i % 3 === 0 ? palette.accent : palette.ink, range(random, 0.5, 0.82)));
    }
    for (let i = 0; i < 5; i += 1) {
      const cx = range(random, left + 50, right - 50);
      const cy = range(random, top + 80, bottom - 80);
      parts.push(`<path d="M ${cx} ${cy + 18} C ${cx - 34} ${cy - 6}, ${cx - 14} ${cy - 30}, ${cx} ${cy - 14} C ${cx + 14} ${cy - 30}, ${cx + 34} ${cy - 6}, ${cx} ${cy + 18} Z" fill="${palette.accent2}" opacity="0.75"/>`);
    }
  }

  if (pattern === 'blobs') {
    const colors = [palette.accent, palette.accent2, palette.rim, palette.case];
    for (let i = 0; i < 9; i += 1) {
      const cx = range(random, left + 60, right - 60);
      const cy = range(random, top + 80, bottom - 60);
      const rx = range(random, 60, 130);
      const ry = range(random, 55, 120);
      parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${colors[i % colors.length]}" opacity="${i % 3 === 0 ? 0.85 : 0.55}" transform="rotate(${range(random, -40, 40)} ${cx} ${cy})"/>`);
    }
    for (let i = 0; i < 6; i += 1) {
      parts.push(`<circle cx="${range(random, left + 40, right - 40)}" cy="${range(random, top + 40, bottom - 40)}" r="4" fill="${palette.ink}" opacity="0.3"/>`);
    }
  }

  if (pattern === 'geo') {
    const cx = left + width / 2;
    const cy = top + 360;
    for (let i = 1; i <= 7; i += 1) {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${i * 38}" fill="none" stroke="${i % 2 === 0 ? palette.accent : palette.ink}" stroke-width="1.6" opacity="${0.5 - i * 0.04}"/>`);
    }
    parts.push(`<path d="M ${left} ${cy} A ${width / 2} ${width / 2} 0 0 1 ${right} ${cy} Z" fill="${palette.accent}" opacity="0.82"/>`);
    for (let i = 0; i < 14; i += 1) {
      const y = cy + 100 + i * 34;
      if (y < bottom - 20) {
        parts.push(`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="${palette.ink}" stroke-width="1" opacity="0.16"/>`);
      }
    }
    parts.push(`<circle cx="${right - 90}" cy="${bottom - 120}" r="34" fill="none" stroke="${palette.ink}" stroke-width="1.4" opacity="0.4"/>`);
  }

  if (pattern === 'smileys') {
    for (let i = 0; i < 12; i += 1) {
      parts.push(smiley(range(random, left + 50, right - 50), range(random, top + 60, bottom - 50), range(random, 26, 46), palette, range(random, 0.65, 0.95)));
    }
    for (let i = 0; i < 10; i += 1) {
      parts.push(star(range(random, left + 30, right - 30), range(random, top + 40, bottom - 30), 7, 2, palette.ink, 0.35));
    }
  }

  if (pattern === 'night') {
    const gradient = `<rect x="${left}" y="${top}" width="${width}" height="${bottom - top}" fill="url(#nightGradient)"/>`;
    parts.push(gradient);
    parts.push(`<circle cx="${right - 120}" cy="${top + 190}" r="58" fill="${palette.accent}" opacity="0.95"/>`);
    parts.push(`<circle cx="${right - 140}" cy="${top + 176}" r="48" fill="${palette.case}" opacity="0.55"/>`);
    for (let i = 0; i < 42; i += 1) {
      const cx = range(random, left + 24, right - 24);
      const cy = range(random, top + 30, bottom - 30);
      const size = range(random, 1.4, 4.2);
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${size}" fill="${palette.ink}" opacity="${range(random, 0.4, 1)}"/>`);
    }
    for (let i = 0; i < 8; i += 1) {
      parts.push(star(range(random, left + 40, right - 40), range(random, top + 60, bottom - 50), range(random, 6, 12), 2, palette.ink, 0.8));
    }
  }

  return parts.join('');
}

function buildCase(slug, pattern, palette) {
  const patternMarkup = renderPattern(pattern, palette, slug);
  const rimGradient = `<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.rim}"/><stop offset="0.55" stop-color="${palette.rim}" stop-opacity="0.65"/><stop offset="1" stop-color="${palette.ink}" stop-opacity="0.45"/></linearGradient>`;
  const gloss = `<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/><stop offset="0.42" stop-color="#FFFFFF" stop-opacity="0.06"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`;
  const nightGradient = `<linearGradient id="nightGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.rim}"/><stop offset="1" stop-color="${palette.case}"/></linearGradient>`;

  return `
    <defs>
      <filter id="softShadow" x="-40%" y="-30%" width="180%" height="180%">
        <feDropShadow dx="0" dy="28" stdDeviation="26" flood-color="#2E3639" flood-opacity="0.22"/>
      </filter>
      <filter id="paintBlur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="28"/>
      </filter>
      <clipPath id="caseClip">
        <rect x="242" y="124" width="416" height="852" rx="74"/>
      </clipPath>
      ${rimGradient}
      ${gloss}
      ${nightGradient}
    </defs>
    <rect width="900" height="1100" fill="${palette.bg}"/>
    <circle cx="710" cy="236" r="188" fill="${palette.accent2}" opacity="0.28"/>
    <circle cx="150" cy="900" r="150" fill="${palette.accent}" opacity="0.08"/>
    <g filter="url(#softShadow)">
      <rect x="230" y="112" width="440" height="876" rx="84" fill="url(#rim)"/>
      <rect x="238" y="120" width="424" height="860" rx="80" fill="${palette.case}"/>
      <g clip-path="url(#caseClip)">
        ${patternMarkup}
        <rect x="242" y="124" width="416" height="852" fill="url(#gloss)"/>
      </g>
      <rect x="268" y="152" width="188" height="188" rx="50" fill="${palette.case}" stroke="${palette.rim}" stroke-width="2"/>
      <rect x="268" y="152" width="188" height="188" rx="50" fill="${palette.ink}" opacity="0.06"/>
      <circle cx="314" cy="198" r="27" fill="${palette.rim}"/>
      <circle cx="314" cy="198" r="19" fill="#2E3639"/>
      <circle cx="314" cy="198" r="9" fill="#111A1D"/>
      <circle cx="307" cy="191" r="4" fill="#FFFFFF" opacity="0.5"/>
      <circle cx="314" cy="288" r="27" fill="${palette.rim}"/>
      <circle cx="314" cy="288" r="19" fill="#2E3639"/>
      <circle cx="314" cy="288" r="9" fill="#111A1D"/>
      <circle cx="307" cy="281" r="4" fill="#FFFFFF" opacity="0.5"/>
      <circle cx="402" cy="198" r="27" fill="${palette.rim}"/>
      <circle cx="402" cy="198" r="19" fill="#2E3639"/>
      <circle cx="402" cy="198" r="9" fill="#111A1D"/>
      <circle cx="395" cy="191" r="4" fill="#FFFFFF" opacity="0.5"/>
      <circle cx="402" cy="288" r="8" fill="#F8E6C8" opacity="0.9"/>
      <text x="450" y="930" text-anchor="middle" font-family="Sora, Arial, sans-serif" font-size="24" letter-spacing="7" fill="${pattern === 'night' ? '#F8F1E6' : palette.ink}" opacity="0.5">LS</text>
      <rect x="222" y="286" width="9" height="88" rx="4" fill="${palette.rim}"/>
      <rect x="222" y="392" width="9" height="58" rx="4" fill="${palette.rim}"/>
      <rect x="669" y="330" width="9" height="118" rx="4" fill="${palette.rim}"/>
    </g>
  `;
}

const phoneMarkup = (slug, pattern, palette) => buildCase(slug, pattern, palette);

for (const product of products) {
  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" width="900" height="1100" role="img">${phoneMarkup(product.slug, product.pattern, product.palette)}</svg>`;
  const detail = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" width="900" height="1100" role="img">
    <defs>
      <filter id="detailBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="55"/></filter>
    </defs>
    <rect width="900" height="1100" fill="${product.palette.bg}"/>
    <circle cx="450" cy="550" r="360" fill="${product.palette.accent2}" opacity="0.25" filter="url(#detailBlur)"/>
    <g transform="rotate(-5 450 550)">
      <g transform="translate(-482 -328) scale(2.05)">
        ${phoneMarkup(product.slug, product.pattern, product.palette)}
      </g>
    </g>
    <rect x="0" y="0" width="900" height="1100" fill="none" stroke="${product.palette.rim}" stroke-width="0" opacity="0"/>
  </svg>`;

  await writeFile(path.join(OUT_DIR, `${product.slug}.svg`), front);
  await writeFile(path.join(OUT_DIR, `${product.slug}-detalhe.svg`), detail);
}

const index = `<!doctype html><meta charset="utf-8"><title>Case art</title><body style="margin:0;background:#F7F3EE;font-family:sans-serif"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px">${products
  .map((p) => `<figure style="margin:0;background:#fff;padding:12px;border-radius:12px"><img src="./${p.slug}.svg" style="width:100%;display:block;border-radius:8px" loading="lazy"><figcaption style="font-size:12px;color:#555;padding-top:6px">${p.slug}</figcaption></figure>`)
  .join('')}</div></body>`;
await writeFile(path.join(OUT_DIR, '_preview.html'), index);

console.log(`Generated ${products.length * 2} SVG case images in ${OUT_DIR}`);
