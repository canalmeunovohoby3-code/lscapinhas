import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { PhoneModel } from '../types/catalog';

export function useModelRequest() {
  const navigate = useNavigate();
  const { requestItems, setSelectedModel, addRequestItem } = useStore();

  return useCallback(
    (model: PhoneModel) => {
      const inRequest = requestItems.some((item) => item.modelId === model.id);
      setSelectedModel(model.id);

      if (inRequest) {
        navigate('/solicitacao');
        return;
      }

      addRequestItem(model.id, 1);
    },
    [addRequestItem, navigate, requestItems, setSelectedModel],
  );
}
