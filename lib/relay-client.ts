/**
 * ======================================================================
 * VINATECH MES - HYBRID RELAY CLIENT HELPER
 * Author: Nguyen Van Duc (vanduc - EA Team)
 * ======================================================================
 */

export function getRelayBaseUrl(): string | null {
  const url = process.env.MES_RELAY_URL;
  if (url && !url.includes('loca.lt')) {
    return url.trim().replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:5000';
}

export function getRelayHeaders(): Record<string, string> {
  const secret = process.env.MES_RELAY_SECRET || 'vinatech_secret_token_2026';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${secret}`,
    'Bypass-Tunnel-Reminder': 'true',
    'bypass-tunnel-reminder': 'true',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  };
}

export async function fetchFromRelay<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: any;
    timeoutMs?: number;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const primaryUrl = getRelayBaseUrl();
  const urlsToTry: string[] = [];
  if (primaryUrl) urlsToTry.push(primaryUrl);
  if (!urlsToTry.includes('http://127.0.0.1:5000')) urlsToTry.push('http://127.0.0.1:5000');

  const { method = 'GET', body, timeoutMs = 15000 } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let lastError = 'NO_RELAY_AVAILABLE';

  for (const baseUrl of urlsToTry) {
    const targetUrl = `${baseUrl}${cleanEndpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(targetUrl, {
        method,
        headers: getRelayHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        lastError = `Relay responded with HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      return { success: true, data };
    } catch (err: any) {
      lastError = err.name === 'AbortError'
        ? `Relay request timed out (>${timeoutMs / 1000}s)`
        : err.message;
    }
  }

  return { success: false, error: lastError };
}
