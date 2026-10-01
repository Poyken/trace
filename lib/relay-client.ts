/**
 * ======================================================================
 * VINATECH MES - HYBRID RELAY CLIENT HELPER
 * Author: Nguyen Van Duc (vanduc - EA Team)
 * ======================================================================
 */

export function getRelayBaseUrl(): string | null {
  const url = process.env.MES_RELAY_URL;
  if (!url) return null;
  return url.trim().replace(/\/+$/, '');
}

export function getRelayHeaders(): Record<string, string> {
  const secret = process.env.MES_RELAY_SECRET || 'vinatech_secret_token_2026';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${secret}`,
    'bypass-tunnel-reminder': 'true'
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
  const baseUrl = getRelayBaseUrl();
  if (!baseUrl) {
    return { success: false, error: 'NO_RELAY_CONFIGURED' };
  }

  const { method = 'GET', body, timeoutMs = 4000 } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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
      return { success: false, error: `Relay responded with HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    const errorMsg = (err as Error).name === 'AbortError' 
      ? 'Relay request timed out (>4s)' 
      : (err as Error).message;
    return { success: false, error: errorMsg };
  }
}
