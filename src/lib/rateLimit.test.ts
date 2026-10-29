import { describe, expect, it, vi } from 'vitest';
import {
  ORDER_RATE_LIMIT,
  ORDER_RATE_LIMIT_KEY,
  ORDER_RATE_WINDOW_SECONDS,
  consumeOrderRateLimit,
} from '../../supabase/functions/create-order/rate-limit';

describe('rate limit global de criação de pedidos', () => {
  it('consome o bucket global fixo, sem depender de IP ou headers', async () => {
    const consume = vi.fn(async () => true);

    await expect(consumeOrderRateLimit(consume)).resolves.toBe(true);
    expect(consume).toHaveBeenCalledWith(
      ORDER_RATE_LIMIT_KEY,
      ORDER_RATE_LIMIT,
      ORDER_RATE_WINDOW_SECONDS,
    );
    expect(ORDER_RATE_LIMIT_KEY).toHaveLength(64);
    expect(ORDER_RATE_LIMIT).toBe(30);
    expect(ORDER_RATE_WINDOW_SECONDS).toBe(60);
  });

  it('propaga a negação do banco', async () => {
    const consume = vi.fn(async () => false);

    await expect(consumeOrderRateLimit(consume)).resolves.toBe(false);
  });
});
