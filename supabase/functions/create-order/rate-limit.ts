export const ORDER_RATE_LIMIT = 30;
export const ORDER_RATE_WINDOW_SECONDS = 60;

// Chave fixa de bucket global. Não é segredo; serve apenas para limitar o
// volume total de criação de pedidos e não depende de IP/headers do cliente.
export const ORDER_RATE_LIMIT_KEY = 'a'.repeat(64);

export type RateLimitConsumer = (
  key: string,
  limit: number,
  windowSeconds: number,
) => Promise<boolean>;

export async function consumeOrderRateLimit(
  consume: RateLimitConsumer,
): Promise<boolean> {
  return consume(
    ORDER_RATE_LIMIT_KEY,
    ORDER_RATE_LIMIT,
    ORDER_RATE_WINDOW_SECONDS,
  );
}
