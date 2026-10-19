import type { Category, Style } from '../types/catalog';

export const categories: Category[] = [
  {
    id: 'minimalistas',
    name: 'Minimalistas',
    description: 'Linhas limpas, tons neutros e composições discretas.',
    image: '/cases/minimal-off-white.svg',
  },
  {
    id: 'florais',
    name: 'Florais',
    description: 'Pétalas, folhagens e desenhos inspirados na natureza.',
    image: '/cases/flor-de-cerejeira.svg',
  },
  {
    id: 'divertidas',
    name: 'Divertidas',
    description: 'Cores, formas e detalhes para um visual descontraído.',
    image: '/cases/sorrisos.svg',
  },
  {
    id: 'personalizadas',
    name: 'Personalizadas',
    description: 'Estampas com nome, frases e detalhes escolhidos por você.',
    image: '/cases/seu-nome.svg',
  },
  {
    id: 'transparente',
    name: 'Transparente',
    description: 'Acabamento cristalino que valoriza o design do aparelho.',
    image: '/cases/cristal-transparente.svg',
  },
  {
    id: 'coloridas',
    name: 'Coloridas',
    description: 'Tons quentes e combinações cheias de personalidade.',
    image: '/cases/ondas-terracota.svg',
  },
];

export const styles: Style[] = [
  { id: 'floral', name: 'Floral' },
  { id: 'minimalista', name: 'Minimalista' },
  { id: 'geometrico', name: 'Geométrico' },
  { id: 'abstrato', name: 'Abstrato' },
  { id: 'frases', name: 'Frases' },
  { id: 'animal', name: 'Animal' },
  { id: 'classico', name: 'Clássico' },
  { id: 'colorido', name: 'Colorido' },
  { id: 'celestial', name: 'Celestial' },
  { id: 'romantico', name: 'Romântico' },
  { id: 'divertido', name: 'Divertido' },
  { id: 'personalizado', name: 'Personalizado' },
];
