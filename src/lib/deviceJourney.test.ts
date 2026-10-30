import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { MOCKUP_REGISTRY } from '../customizer/registry';
import {
  getJourneyBrands,
  getJourneyModel,
  getJourneyModels,
  isPersonalizationAvailable,
  resolveJourneyBrand,
} from './deviceJourney';

describe('device journey', () => {
  it('usa as marcas e modelos do catálogo existente', () => {
    expect(getJourneyBrands()).toBe(catalog.brands);
    expect(getJourneyModels('apple')).toBe(catalog.brands[0].models);
    expect(getJourneyModels('marca-inexistente')).toEqual([]);
  });

  it('resolve a marca pela modelo quando a marca não veio na URL', () => {
    expect(resolveJourneyBrand(null, 'iphone-16-pro-max')?.id).toBe('apple');
    expect(resolveJourneyBrand('samsung', 'iphone-16-pro-max')?.id).toBe('samsung');
  });

  it('mantém o modelo selecionado apenas dentro da marca correta', () => {
    expect(getJourneyModel('apple', 'iphone-16-pro-max')?.name).toBe('iPhone 16 Pro Max');
    expect(getJourneyModel('samsung', 'iphone-16-pro-max')).toBeNull();
  });

  it('consulta disponibilidade no registry', () => {
    expect(isPersonalizationAvailable('iphone-16-pro-max')).toBe(true);
    expect(isPersonalizationAvailable('iphone-11')).toBe(true);
    expect(isPersonalizationAvailable('iphone-11-pro-max')).toBe(true);
    expect(isPersonalizationAvailable('iphone-12-pro-max')).toBe(true);
    expect(isPersonalizationAvailable('galaxy-s21-plus')).toBe(true);
    expect(isPersonalizationAvailable('galaxy-s24-plus')).toBe(true);
    expect(isPersonalizationAvailable('moto-g24')).toBe(true);
    expect(isPersonalizationAvailable('poco-m6')).toBe(false);
    expect(isPersonalizationAvailable('galaxy-s23')).toBe(true);
    expect(isPersonalizationAvailable('moto-g84')).toBe(true);
    expect(isPersonalizationAvailable('redmi-note-14')).toBe(true);
    expect(isPersonalizationAvailable('iphone-16-pro')).toBe(true);
    expect(isPersonalizationAvailable(null)).toBe(false);
  });

  it('aplica a mesma regra a todos os modelos do catálogo', () => {
    const availableModels = catalog.models.filter((model) =>
      isPersonalizationAvailable(model.id),
    );

    const expected = new Set(MOCKUP_REGISTRY.map((entry) => entry.modelId));

    expect(new Set(availableModels.map((model) => model.id))).toEqual(expected);
    expect(MOCKUP_REGISTRY.every((entry) => catalog.models.some((model) => model.id === entry.modelId))).toBe(true);

    for (const model of catalog.models) {
      expect(isPersonalizationAvailable(model.id)).toBe(expected.has(model.id));
    }
    expect(isPersonalizationAvailable('poco-m6')).toBe(false);
  });

  it('filtra modelos sem alterar os dados do catálogo', () => {
    expect(getJourneyModels('apple', '16 pro max').map((model) => model.id)).toEqual([
      'iphone-16-pro-max',
    ]);
    expect(getJourneyModels('apple', 'galaxy')).toEqual([]);
  });
});
