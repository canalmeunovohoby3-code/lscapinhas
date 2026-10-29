import { describe, expect, it, vi } from 'vitest';
import {
  ORDER_CLIENT_RATE_LIMIT,
  ORDER_RATE_LIMIT,
  ORDER_RATE_LIMIT_KEY,
  ORDER_RATE_WINDOW_SECONDS,
  consumeOrderRateLimits,
  getClientIp,
  hashClientKey,
} from '../../supabase/functions/create-order/rate-limit';

const CLIENT_KEY = 'a'.repeat(64);

describe('rate limit de criação de pedidos', () => {
  it('aplica limite por cliente e depois o limite global', async () => {
    const consume = vi.fn(async () => true);

    await expect(consumeOrderRateLimits(CLIENT_KEY, consume)).resolves.toBe(true);
    expect(consume).toHaveBeenNthCalledWith(
      1,
      `client:${CLIENT_KEY}`,
      ORDER_CLIENT_RATE_LIMIT,
      ORDER_RATE_WINDOW_SECONDS,
    );
    expect(consume).toHaveBeenNthCalledWith(
      2,
      ORDER_RATE_LIMIT_KEY,
      ORDER_RATE_LIMIT,
      ORDER_RATE_WINDOW_SECONDS,
    );
    expect(ORDER_CLIENT_RATE_LIMIT).toBe(10);
    expect(ORDER_RATE_LIMIT).toBe(30);
  });

  it('não consome o bucket global quando o cliente excedeu o limite', async () => {
    const consume = vi.fn(async () => false);

    await expect(consumeOrderRateLimits(CLIENT_KEY, consume)).resolves.toBe(false);
    expect(consume).toHaveBeenCalledTimes(1);
  });

  it('usa somente o bucket global quando não há origem confiável', async () => {
    const consume = vi.fn(async () => true);

    await expect(consumeOrderRateLimits(null, consume)).resolves.toBe(true);
    expect(consume).toHaveBeenCalledWith(
      ORDER_RATE_LIMIT_KEY,
      ORDER_RATE_LIMIT,
      ORDER_RATE_WINDOW_SECONDS,
    );
  });
});

describe('origem do cliente', () => {
  it('prioriza cf-connecting-ip e usa o último encaminhamento', () => {
    expect(getClientIp(new Request('https://example.test', {
      headers: { 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': 'fake' },
    }))).toBe('203.0.113.5');

    expect(getClientIp(new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.6, 198.51.100.1' },
    }))).toBe('198.51.100.1');

    expect(getClientIp(new Request('https://example.test'))).toBeNull();
  });

  it('gera hash estável sem guardar o IP bruto', async () => {
    const first = await hashClientKey('203.0.113.10');
    const second = await hashClientKey('203.0.113.10');

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
    expect(first).not.toContain('203.0.113.10');
  });
});
