import { catalog } from '../data/catalog';
import type { PhoneModel } from '../types/catalog';

export interface ModelIllustration {
  image: string;
  hoverImage: string;
}

export function getModelIllustration(model: PhoneModel): ModelIllustration {
  const index = catalog.models.findIndex((entry) => entry.id === model.id);
  const products = catalog.products;
  const product = products[(index >= 0 ? index : 0) % products.length];

  return {
    image: product.images[0],
    hoverImage: product.images[1] ?? product.images[0],
  };
}
