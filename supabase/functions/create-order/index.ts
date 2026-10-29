import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  handleCreateOrder,
  IdempotencyConflictError,
  type CreateOrderInput,
  type CreatedOrder,
} from './handler.ts';
import { consumeOrderRateLimits, getClientKey } from './rate-limit.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_ORIGIN =
  Deno.env.get('ALLOWED_ORIGIN')?.trim() || 'https://lscapinhas.vercel.app';

function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Configuração do Supabase ausente.');
  }

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

Deno.serve((request) => handleCreateOrder(request, {
  allowedOrigin: ALLOWED_ORIGIN,
  getClientKey,
  consumeRateLimit: (clientKey) => consumeOrderRateLimits(
    clientKey,
    async (key, limit, windowSeconds) => {
      const { data, error } = await getSupabase().rpc('consume_order_rate_limit', {
        p_client_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });

      if (error) {
        throw error;
      }

      return data === true;
    },
  ),
  createOrder: async (input: CreateOrderInput, idempotencyKey: string): Promise<CreatedOrder> => {
    const { data, error } = await getSupabase().rpc('create_public_order', {
      p_customer_name: input.customerName,
      p_customer_contact: input.customerContact,
      p_notes: input.notes,
      p_items: input.items,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      if (error.message.includes('IDEMPOTENCY_CONFLICT')) {
        throw new IdempotencyConflictError();
      }

      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row || typeof row.order_id !== 'string' || row.order_id.length === 0) {
      throw new Error('Resposta inválida do banco ao criar o pedido.');
    }

    return {
      orderId: row.order_id,
      uploadToken: typeof row.upload_token === 'string' ? row.upload_token : null,
    };
  },
}));
