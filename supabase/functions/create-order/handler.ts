export interface OrderItemInput {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerContact: string;
  notes: string;
  items: OrderItemInput[];
}

export interface CreateOrderDeps {
  allowedOrigin: string;
  consumeRateLimit: () => Promise<boolean>;
  createOrder: (input: CreateOrderInput) => Promise<string>;
}

const MAX_BODY_BYTES = 25_000;
const MAX_NAME_LENGTH = 120;
const MAX_CONTACT_LENGTH = 80;
const MAX_NOTES_LENGTH = 1_000;
const MAX_ITEM_TEXT_LENGTH = 80;

class InputError extends Error {}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(status: number, body: unknown, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  value: unknown,
  field: string,
  maxLength: number,
  required: boolean,
): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new InputError(`Campo obrigatório ausente: ${field}.`);
    }
    return '';
  }

  if (typeof value !== 'string') {
    throw new InputError(`Campo inválido: ${field}.`);
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new InputError(`Campo obrigatório ausente: ${field}.`);
  }

  if (trimmed.length > maxLength) {
    throw new InputError(`Campo muito longo: ${field}.`);
  }

  return trimmed;
}

function parseOrderInput(body: Record<string, unknown>): CreateOrderInput {
  const rawItems = body.items;

  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 20) {
    throw new InputError('O pedido deve ter entre 1 e 20 itens.');
  }

  const items: OrderItemInput[] = rawItems.map((rawItem) => {
    if (!isRecord(rawItem)) {
      throw new InputError('Item de pedido inválido.');
    }

    const quantity = rawItem.quantity;

    if (
      typeof quantity !== 'number'
      || !Number.isInteger(quantity)
      || quantity < 1
      || quantity > 99
    ) {
      throw new InputError('Quantidade inválida no pedido.');
    }

    return {
      brandId: readString(rawItem.brandId, 'brandId', MAX_ITEM_TEXT_LENGTH, true),
      brandName: readString(rawItem.brandName, 'brandName', MAX_ITEM_TEXT_LENGTH, true),
      modelId: readString(rawItem.modelId, 'modelId', MAX_ITEM_TEXT_LENGTH, true),
      modelName: readString(rawItem.modelName, 'modelName', MAX_ITEM_TEXT_LENGTH, true),
      quantity,
    };
  });

  return {
    customerName: readString(body.customerName, 'customerName', MAX_NAME_LENGTH, true),
    customerContact: readString(body.customerContact, 'customerContact', MAX_CONTACT_LENGTH, true),
    notes: readString(body.notes, 'notes', MAX_NOTES_LENGTH, false),
    items,
  };
}

export async function handleCreateOrder(
  request: Request,
  deps: CreateOrderDeps,
): Promise<Response> {
  const origin = deps.allowedOrigin;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido.' }, origin);
  }

  const rawBody = await request.text();

  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Requisição muito grande.' }, origin);
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: 'JSON inválido.' }, origin);
  }

  if (!isRecord(parsedBody)) {
    return jsonResponse(400, { error: 'Corpo da requisição inválido.' }, origin);
  }

  let input: CreateOrderInput;

  try {
    input = parseOrderInput(parsedBody);
  } catch (error) {
    if (error instanceof InputError) {
      return jsonResponse(400, { error: error.message }, origin);
    }
    return jsonResponse(400, { error: 'Pedido inválido.' }, origin);
  }

  try {
    const withinRateLimit = await deps.consumeRateLimit();

    if (!withinRateLimit) {
      return jsonResponse(
        429,
        { error: 'Muitas solicitações. Tente novamente em instantes.' },
        origin,
      );
    }

    const orderId = await deps.createOrder(input);

    if (typeof orderId !== 'string' || orderId.length === 0) {
      throw new Error('Resposta inválida ao criar o pedido.');
    }

    return jsonResponse(201, { orderId }, origin);
  } catch (error) {
    console.error('create-order protection failure', error);
    return jsonResponse(503, { error: 'Serviço temporariamente indisponível.' }, origin);
  }
}
