import { describe, expect, it, vi } from 'vitest';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  ORDER_IDEMPOTENCY_STORAGE_KEY,
  buildOrderItems,
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
  createStoragePath,
  submitOrder,
  validateOrderForm,
  validateOrderImages,
  type ImageLike,
  type OrderImagePayload,
} from './orderForm';

const ORDER_ID = '11111111-1111-4111-8111-111111111111';
const FILE_ID = '22222222-2222-4222-8222-222222222222';
const IDEMPOTENCY_KEY = '33333333-3333-4333-8333-333333333333';
const UPLOAD_TOKEN = 'a'.repeat(64);

const jpeg: ImageLike = {
  name: 'frente.jpg',
  size: 1_000_000,
  type: 'image/jpeg',
};

const png: ImageLike = {
  name: 'verso.png',
  size: 2_000_000,
  type: 'image/png',
};

describe('validateOrderImages', () => {
  it('aceita JPEG, PNG e WebP dentro dos limites', () => {
    expect(validateOrderImages([jpeg, png, { ...jpeg, name: 'arte.webp', type: 'image/webp' }]))
      .toBeNull();
  });

  it('rejeita formato não permitido', () => {
    expect(validateOrderImages([{ ...jpeg, type: 'image/gif' }]))
      .toBe('A imagem "frente.jpg" não está em JPEG, PNG ou WebP.');
  });

  it('rejeita arquivo vazio ou acima de 10 MB', () => {
    expect(validateOrderImages([{ ...jpeg, size: 0 }])).toContain('está vazia');
    expect(validateOrderImages([{ ...jpeg, size: MAX_IMAGE_BYTES + 1 }])).toContain('10 MB');
  });

  it('rejeita mais de 12 imagens', () => {
    const files = Array.from({ length: MAX_IMAGES + 1 }, (_, index) => ({
      ...jpeg,
      name: `foto-${index}.jpg`,
    }));

    expect(validateOrderImages(files)).toBe(`Envie no máximo ${MAX_IMAGES} imagens.`);
  });
});

describe('buildOrderItems', () => {
  it('converte os modelos do catálogo no contrato de create_custom_order', () => {
    const items = buildOrderItems([
      { modelId: 'iphone-16', quantity: 2 },
      { modelId: 'moto-g84', quantity: 1 },
    ]);

    expect(items).toEqual([
      {
        brandId: 'apple',
        brandName: 'Apple iPhone',
        modelId: 'iphone-16',
        modelName: 'iPhone 16',
        quantity: 2,
      },
      {
        brandId: 'motorola',
        brandName: 'Motorola',
        modelId: 'moto-g84',
        modelName: 'Moto G84',
        quantity: 1,
      },
    ]);
  });

  it('rejeita modelo inexistente', () => {
    expect(() => buildOrderItems([{ modelId: 'modelo-inexistente', quantity: 1 }]))
      .toThrow('não está mais disponível');
  });
});

describe('createStoragePath', () => {
  it('gera caminho com pedido, token e arquivo', () => {
    expect(createStoragePath(ORDER_ID, UPLOAD_TOKEN, jpeg, FILE_ID))
      .toBe(`orders/${ORDER_ID}/${UPLOAD_TOKEN}/${FILE_ID}.jpg`);
  });

  it('rejeita pedido, token, arquivo ou formato inválido', () => {
    expect(() => createStoragePath('pedido-invalido', UPLOAD_TOKEN, jpeg, FILE_ID)).toThrow();
    expect(() => createStoragePath(ORDER_ID, 'token-invalido', jpeg, FILE_ID)).toThrow();
    expect(() => createStoragePath(ORDER_ID, UPLOAD_TOKEN, jpeg, 'arquivo-invalido')).toThrow();
    expect(() => createStoragePath(ORDER_ID, UPLOAD_TOKEN, { type: 'image/gif' }, FILE_ID))
      .toThrow();
  });
});

describe('idempotência no formulário', () => {
  function makeStorage(initial?: string) {
    let value = initial ?? null;
    return {
      getItem: (key: string) => (key === ORDER_IDEMPOTENCY_STORAGE_KEY ? value : null),
      setItem: (key: string, next: string) => {
        if (key === ORDER_IDEMPOTENCY_STORAGE_KEY) value = next;
      },
      removeItem: (key: string) => {
        if (key === ORDER_IDEMPOTENCY_STORAGE_KEY) value = null;
      },
    };
  }

  it('reutiliza a chave salva e cria apenas para uma nova intenção', () => {
    const storage = makeStorage();
    const first = getOrCreateIdempotencyKey(storage);
    const second = getOrCreateIdempotencyKey(storage);

    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    expect(second).toBe(first);

    clearIdempotencyKey(storage);
    expect(getOrCreateIdempotencyKey(storage)).not.toBe(first);
  });

  it('ignora chave salva inválida', () => {
    const storage = makeStorage('inválida');
    const key = getOrCreateIdempotencyKey(storage);

    expect(key).not.toBe('inválida');
    expect(storage.getItem(ORDER_IDEMPOTENCY_STORAGE_KEY)).toBe(key);
  });
});

describe('validateOrderForm', () => {
  it('exige nome, contato, item e token', () => {
    const errors = validateOrderForm({
      customerName: '',
      customerContact: '',
      notes: '',
      items: [],
      images: [],
    });

    expect(errors.customerName).toBeDefined();
    expect(errors.customerContact).toBeDefined();
    expect(errors.items).toBeDefined();
  });

  it('aceita um formulário válido', () => {
    expect(validateOrderForm({
      customerName: 'Ana',
      customerContact: '(24) 99999-9999',
      notes: '',
      items: [{ modelId: 'iphone-16', quantity: 1 }],
      images: [jpeg],
    })).toEqual({});
  });
});

describe('submitOrder', () => {
  function makeDeps() {
    const createOrder = vi.fn(async () => ({
      orderId: ORDER_ID,
      uploadToken: UPLOAD_TOKEN,
    }));
    const uploadImage = vi.fn(async (_path: string, _file: ImageLike) => undefined);
    const attachImages = vi.fn(async (_orderId: string, _images: OrderImagePayload[]) => undefined);
    const releaseUploadToken = vi.fn(async () => undefined);
    const makePath = vi.fn((orderId: string, uploadToken: string, file: ImageLike) =>
      `orders/${orderId}/${uploadToken}/${file.name.replace(/\W/g, '-')}`,
    );

    return { createOrder, uploadImage, attachImages, releaseUploadToken, makePath };
  }

  function makeInput(images: ImageLike[]) {
    return {
      customerName: 'Ana',
      customerContact: '(24) 99999-9999',
      notes: 'Teste',
      items: buildOrderItems([{ modelId: 'iphone-16', quantity: 2 }]),
      images,
      idempotencyKey: IDEMPOTENCY_KEY,
    };
  }

  it('cria o pedido, envia as imagens e registra os caminhos', async () => {
    const deps = makeDeps();
    const result = await submitOrder(makeInput([jpeg, png]), deps);

    expect(deps.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ items: expect.any(Array), idempotencyKey: IDEMPOTENCY_KEY }),
    );
    expect(deps.uploadImage).toHaveBeenCalledTimes(2);
    expect(deps.attachImages).toHaveBeenCalledTimes(1);
    expect(deps.releaseUploadToken).toHaveBeenCalledWith(ORDER_ID, UPLOAD_TOKEN);
    expect(result).toMatchObject({
      orderId: ORDER_ID,
      uploadToken: UPLOAD_TOKEN,
      failedImages: [],
      attachError: null,
    });
    expect(result.uploaded).toHaveLength(2);
    expect(result.uploaded[0]).toMatchObject({
      path: `orders/${ORDER_ID}/${UPLOAD_TOKEN}/frente-jpg`,
      fileName: 'frente.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1_000_000,
    });
  });

  it('mantém as imagens que passaram e registra a falha parcial', async () => {
    const deps = makeDeps();
    deps.uploadImage.mockImplementation(async (_path: string, file: ImageLike) => {
      if (file.name === 'verso.png') {
        throw new Error('Falha no upload');
      }
    });

    const result = await submitOrder(makeInput([jpeg, png]), deps);

    expect(deps.attachImages).toHaveBeenCalledTimes(1);
    expect(deps.releaseUploadToken).not.toHaveBeenCalled();
    expect(result.uploaded).toHaveLength(1);
    expect(result.failedImages).toEqual(['verso.png']);
    expect(result.attachError).toBeNull();
  });

  it('informa falha ao registrar imagens já enviadas', async () => {
    const deps = makeDeps();
    deps.attachImages.mockRejectedValue(new Error('Falha ao registrar'));

    const result = await submitOrder(makeInput([jpeg]), deps);

    expect(result.uploaded).toHaveLength(1);
    expect(result.attachError).toContain('não puderam ser registradas');
    expect(deps.releaseUploadToken).not.toHaveBeenCalled();
  });

  it('não faz upload se a criação do pedido falhar', async () => {
    const deps = makeDeps();
    deps.createOrder.mockRejectedValue(new Error('Falha ao criar'));

    await expect(submitOrder(makeInput([jpeg]), deps)).rejects.toThrow('Falha ao criar');
    expect(deps.uploadImage).not.toHaveBeenCalled();
    expect(deps.attachImages).not.toHaveBeenCalled();
  });

  it('não registra imagens quando nenhuma foi enviada', async () => {
    const deps = makeDeps();
    const result = await submitOrder(makeInput([]), deps);

    expect(deps.uploadImage).not.toHaveBeenCalled();
    expect(deps.attachImages).not.toHaveBeenCalled();
    expect(result.uploaded).toEqual([]);
    expect(deps.releaseUploadToken).toHaveBeenCalledWith(ORDER_ID, UPLOAD_TOKEN);
  });
});
