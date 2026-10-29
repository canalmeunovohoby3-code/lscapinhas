import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCreateOrder, type CreateOrderInput } from './handler.ts';
import { consumeOrderRateLimit } from './rate-limit.ts';

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
  consumeRateLimit: () => consumeOrderRateLimit(async (key, limit, windowSeconds) => {
    const { data, error } = await getSupabase().rpc('consume_order_rate_limit', {
      p_client_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      throw error;
    }

    return data === true;
  }),
  createOrder: async (input: CreateOrderInput) => {
    const { data, error } = await getSupabase().rpc('create_custom_order', {
      p_customer_name: input.customerName,
      p_customer_contact: input.customerContact,
      p_notes: input.notes,
      p_items: input.items,
    });

    if (error) {
      throw error;
    }

    if (typeof data !== 'string' || data.length === 0) {
      throw new Error('Resposta inválida do banco ao criar o pedido.');
    }

    return data;
  },
}));
