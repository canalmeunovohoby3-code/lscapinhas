import { describe, expect, it, vi } from 'vitest';
import {
  handleCreateOrder,
  type CreateOrderDeps,
} from '../../supabase/functions/create-order/handler';

const validBody = {
  customerName: 'Ana',
  customerContact: '(24) 99999-9999',
  notes: 'Teste',
  items: [
    {
      brandId: 'apple',
      brandName: 'Apple iPhone',
      modelId: 'iphone-16',
      modelName: 'iPhone 16',
      quantity: 1,
    },
  ],
};

function makeDeps(overrides: Partial<CreateOrderDeps> = {}): CreateOrderDeps {
  return {
    allowedOrigin: 'https://lscapinhas.vercel.app',
    consumeRateLimit: vi.fn(async () => true),
    createOrder: vi.fn(async () => 'order-id'),
    ...overrides,
  };
}

function createRequest(
  body: unknown,
  options: { method?: string; rawBody?: string; headers?: Record<string, string> } = {},
): Request {
  return new Request('https://example.test/functions/v1/create-order', {
    method: options.method ?? 'POST',
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
    body: options.method === 'OPTIONS'
      ? undefined
      : options.rawBody ?? JSON.stringify(body),
  });
}

describe('create-order sem Turnstile', () => {
  it('cria o pedido sem token de Turnstile após passar pelo rate limit', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(createRequest(validBody), deps);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ orderId: 'order-id' });
    expect(deps.consumeRateLimit).toHaveBeenCalledTimes(1);
    expect(deps.createOrder).toHaveBeenCalledTimes(1);
    expect(deps.createOrder).toHaveBeenCalledWith({
      customerName: 'Ana',
      customerContact: '(24) 99999-9999',
      notes: 'Teste',
      items: [
        {
          brandId: 'apple',
          brandName: 'Apple iPhone',
          modelId: 'iphone-16',
          modelName: 'iPhone 16',
          quantity: 1,
        },
      ],
    });
  });

  it('bloqueia quando o rate limit global nega a requisição', async () => {
    const create = vi.fn(async () => 'order-id');
    const deps = makeDeps({
      consumeRateLimit: vi.fn(async () => false),
      createOrder: create,
    });

    const response = await handleCreateOrder(createRequest(validBody), deps);

    expect(response.status).toBe(429);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejeita dados obrigatórios ausentes antes de consumir rate limit', async () => {
    const consume = vi.fn(async () => true);
    const deps = makeDeps({ consumeRateLimit: consume });

    const response = await handleCreateOrder(
      createRequest({ customerName: 'Ana' }),
      deps,
    );

    expect(response.status).toBe(400);
    expect(consume).not.toHaveBeenCalled();
    expect(deps.createOrder).not.toHaveBeenCalled();
  });

  it('rejeita lista de itens vazia', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(
      createRequest({ ...validBody, items: [] }),
      deps,
    );

    expect(response.status).toBe(400);
    expect(deps.consumeRateLimit).not.toHaveBeenCalled();
    expect(deps.createOrder).not.toHaveBeenCalled();
  });

  it('rejeita JSON inválido', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(
      createRequest(undefined, { rawBody: '{' }),
      deps,
    );

    expect(response.status).toBe(400);
    expect(deps.createOrder).not.toHaveBeenCalled();
  });

  it('rejeita requisição muito grande', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(
      createRequest({ ...validBody, notes: 'x'.repeat(26_000) }),
      deps,
    );

    expect(response.status).toBe(413);
    expect(deps.consumeRateLimit).not.toHaveBeenCalled();
    expect(deps.createOrder).not.toHaveBeenCalled();
  });

  it('rejeita métodos diferentes de POST', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(
      createRequest(undefined, { method: 'GET' }),
      deps,
    );

    expect(response.status).toBe(405);
    expect(deps.createOrder).not.toHaveBeenCalled();
  });

  it('responde ao preflight com a origem oficial', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(
      createRequest(undefined, { method: 'OPTIONS' }),
      deps,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin'))
      .toBe('https://lscapinhas.vercel.app');
    expect(deps.consumeRateLimit).not.toHaveBeenCalled();
  });

  it('mantém a origem oficial no CORS da resposta de sucesso', async () => {
    const deps = makeDeps();

    const response = await handleCreateOrder(createRequest(validBody), deps);

    expect(response.headers.get('access-control-allow-origin'))
      .toBe('https://lscapinhas.vercel.app');
  });

  it('retorna 503 se o rate limit falhar tecnicamente', async () => {
    const create = vi.fn(async () => 'order-id');
    const deps = makeDeps({
      consumeRateLimit: vi.fn(async () => {
        throw new Error('indisponível');
      }),
      createOrder: create,
    });

    const response = await handleCreateOrder(createRequest(validBody), deps);

    expect(response.status).toBe(503);
    expect(create).not.toHaveBeenCalled();
  });

  it('retorna 503 se a criação falhar e não declara sucesso', async () => {
    const deps = makeDeps({
      createOrder: vi.fn(async () => {
        throw new Error('falha');
      }),
    });

    const response = await handleCreateOrder(createRequest(validBody), deps);

    expect(response.status).toBe(503);
  });
});
