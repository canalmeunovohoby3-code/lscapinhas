import { describe, expect, it } from 'vitest';
import { formatOrderItemLabel, resolveOrderItem } from './orderItems';

const baseItem = {
  brand_name: 'Samsung Galaxy',
  model_id: 'galaxy-s24-ultra',
  model_name: 'Galaxy S24 Ultra',
};

describe('itens do pedido no admin', () => {
  it('exibe marca e modelo exatos, incluindo variante', () => {
    expect(resolveOrderItem({ ...baseItem, model_id: 'iphone-16-pro-max', brand_name: 'Apple iPhone', model_name: 'iPhone 16 Pro Max' }))
      .toEqual({ brandName: 'Apple', modelName: 'iPhone 16 Pro Max' });
    expect(formatOrderItemLabel(baseItem)).toBe('Samsung — Galaxy S24 Ultra');
  });

  it('recupera o modelo pelo model_id quando o nome salvo estiver ausente', () => {
    expect(resolveOrderItem({ ...baseItem, model_name: null }))
      .toEqual({ brandName: 'Samsung', modelName: 'Galaxy S24 Ultra' });
  });

  it('usa o texto salvo quando o model_id não está no catálogo', () => {
    expect(resolveOrderItem({
      brand_name: 'Marca antiga',
      model_id: 'modelo-removido',
      model_name: 'Modelo legado',
    })).toEqual({ brandName: 'Marca antiga', modelName: 'Modelo legado' });
  });

  it('não inventa modelo quando o registro realmente não tem a informação', () => {
    expect(resolveOrderItem({
      brand_name: 'Samsung Galaxy',
      model_id: 'modelo-removido',
      model_name: null,
    })).toEqual({ brandName: 'Samsung Galaxy', modelName: 'Modelo não informado' });
  });
});
