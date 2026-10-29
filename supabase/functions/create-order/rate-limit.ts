export const ORDER_RATE_LIMIT = 30;
export const ORDER_CLIENT_RATE_LIMIT = 10;
export const ORDER_RATE_WINDOW_SECONDS = 60;

// Bucket global: sempre aplicado como proteção final contra abuso.
export const ORDER_RATE_LIMIT_KEY = 'a'.repeat(64);

export type RateLimitConsumer = (
  key: string,
  limit: number,
  windowSeconds: number,
) => Promise<boolean>;

export function getClientIp(request: Request): string | null {
  const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded) return null;

  // O último endereço é o mais próximo do proxy da plataforma. O limite por
  // origem é best-effort; o bucket global continua sendo a proteção principal.
  const chain = forwarded.split(',').map((part) => part.trim()).filter(Boolean);
  return chain[chain.length - 1] ?? null;
}

export async function hashClientKey(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`ls-case-order-client:${ip}`),
  );

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function getClientKey(request: Request): Promise<string | null> {
  const ip = getClientIp(request);
  return ip ? hashClientKey(ip) : null;
}

export async function consumeOrderRateLimits(
  clientKey: string | null,
  consume: RateLimitConsumer,
): Promise<boolean> {
  if (clientKey) {
    const clientAllowed = await consume(
      `client:${clientKey}`,
      ORDER_CLIENT_RATE_LIMIT,
      ORDER_RATE_WINDOW_SECONDS,
    );

    if (!clientAllowed) return false;
  }

  return consume(
    ORDER_RATE_LIMIT_KEY,
    ORDER_RATE_LIMIT,
    ORDER_RATE_WINDOW_SECONDS,
  );
}
