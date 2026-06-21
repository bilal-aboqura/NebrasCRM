const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

const attemptsByIp = new Map<string, number[]>();

export function isRateLimited(
  ip: string,
  now = Date.now(),
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): boolean {
  const windowStart = now - windowMs;
  const recentAttempts = (attemptsByIp.get(ip) ?? []).filter((timestamp) => timestamp > windowStart);

  if (recentAttempts.length >= limit) {
    attemptsByIp.set(ip, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  attemptsByIp.set(ip, recentAttempts);
  return false;
}

export function resetRateLimitStore(): void {
  attemptsByIp.clear();
}
