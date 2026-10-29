import type { PhoneBrand, PhoneModel } from '../types/catalog';
import { useStore } from '../context/StoreContext';
import { useModelRequest } from '../lib/useModelRequest';
import { PhoneModelCard } from './PhoneModelCard';

export function ModelCardGrid({
  entries,
  eagerCount = 4,
}: {
  entries: Array<{ brand: PhoneBrand; model: PhoneModel }>;
  eagerCount?: number;
}) {
  const { selectedModelId, requestItems } = useStore();
  const requestModel = useModelRequest();

  return (
    <div className="model-catalog-grid">
      {entries.map(({ brand, model }, index) => (
        <PhoneModelCard
          key={model.id}
          brand={brand}
          model={model}
          selected={selectedModelId === model.id}
          inRequest={requestItems.some((item) => item.modelId === model.id)}
          eager={index < eagerCount}
          onRequest={() => requestModel(model)}
        />
      ))}
    </div>
  );
}
