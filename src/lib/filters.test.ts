import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { countActiveFilters, defaultFilters, filterProducts } from './filters';

describe('product filters', () => {
  it('retorna somente capinhas compatíveis com o modelo escolhido', () => {
    const results = filterProducts({ modelId: 'iphone-15' });
    expect(results.length).toBeGreaterThan(0);
    for (const product of results) {
      expect(product.compatibleModels).toContain('iphone-15');
    }
  });

  it('não mistura capinhas incompatíveis em nenhuma combinação de filtros', () => {
    const results = filterProducts({
      modelId: 'galaxy-a55',
      category: 'personalizadas',
      price: '40-50',
    });
    for (const product of results) {
      expect(product.compatibleModels).toContain('galaxy-a55');
      expect(product.category).toBe('personalizadas');
      expect(product.price).toBeGreaterThanOrEqual(40);
      expect(product.price).toBeLessThanOrEqual(50);
    }
  });

  it('filtra por categoria e por estilo', () => {
    const floral = filterProducts({ category: 'florais' });
    expect(floral.length).toBeGreaterThan(0);
    expect(floral.every((product) => product.category === 'florais')).toBe(true);

    const personalized = filterProducts({ style: 'personalizado' });
    expect(personalized.length).toBeGreaterThan(0);
    expect(personalized.every((product) => product.styles.includes('personalizado'))).toBe(true);
  });

  it('filtra por faixas de preço sem sobreposição indevida', () => {
    const low = filterProducts({ price: 'ate-40' });
    const mid = filterProducts({ price: '40-50' });
    const high = filterProducts({ price: 'acima-50' });

    expect(low.every((product) => product.price < 40)).toBe(true);
    expect(mid.every((product) => product.price >= 40 && product.price <= 50)).toBe(true);
    expect(high.every((product) => product.price > 50)).toBe(true);
    expect(low.length + mid.length + high.length).toBe(catalog.products.length);
  });

  it('busca por nome de capinha, ignorando acentos e caixa', () => {
    const results = filterProducts({ query: 'GEOMETRICA' });
    expect(results.some((product) => product.slug === 'geometrica-sunrise')).toBe(true);
  });

  it('busca por modelo de celular e retorna capinhas compatíveis', () => {
    const results = filterProducts({ query: 'iPhone 15' });
    expect(results.length).toBeGreaterThan(0);
    for (const product of results) {
      const matchesModel = product.compatibleModels.some((id) =>
        (catalog.models.find((model) => model.id === id)?.name ?? '')
          .toLowerCase()
          .includes('iphone 15'),
      );
      expect(matchesModel || product.name.toLowerCase().includes('iphone 15')).toBe(true);
    }
  });

  it('busca pelo nome da marca', () => {
    const results = filterProducts({ query: 'motorola' });
    expect(results.length).toBeGreaterThan(0);
    for (const product of results) {
      const hasMotorola = product.compatibleModels.some((id) =>
        id.startsWith('moto-'),
      );
      expect(hasMotorola).toBe(true);
    }
  });

  it('combina busca, modelo, categoria e estilo', () => {
    const results = filterProducts({
      query: 'capinha',
      modelId: 'iphone-15',
      category: 'florais',
      style: 'floral',
      price: '40-50',
      sort: 'menor-preco',
    });
    for (const product of results) {
      expect(product.compatibleModels).toContain('iphone-15');
      expect(product.category).toBe('florais');
      expect(product.styles).toContain('floral');
      expect(product.price).toBeGreaterThanOrEqual(40);
      expect(product.price).toBeLessThanOrEqual(50);
    }
    const prices = results.map((product) => product.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('ordena por preço e por nome', () => {
    const ascending = filterProducts({ sort: 'menor-preco' });
    const descending = filterProducts({ sort: 'maior-preco' });
    const names = filterProducts({ sort: 'nome' }).map((product) => product.name);

    expect(ascending[0].price).toBeLessThanOrEqual(ascending[ascending.length - 1].price);
    expect(descending[0].price).toBeGreaterThanOrEqual(descending[descending.length - 1].price);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });

  it('retorna lista vazia para busca sem resultado', () => {
    expect(filterProducts({ query: 'produto que nao existe xyz' })).toHaveLength(0);
  });

  it('conta filtros ativos corretamente', () => {
    expect(countActiveFilters(defaultFilters)).toBe(0);
    expect(
      countActiveFilters({
        ...defaultFilters,
        query: 'floral',
        category: 'florais',
        modelId: 'iphone-15',
        price: 'ate-40',
      }),
    ).toBe(4);
  });
});
