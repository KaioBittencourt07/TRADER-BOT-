const params = new URLSearchParams(window.location.search);
const configuredBase = window.WILL_API_BASE_URL || params.get('api') || '';

export const WILL_API = {
  baseUrl: configuredBase.replace(/\/$/, ''),
  healthPath: '/health',
  marketPath: '/api/market',
  analyzePath: '/api/analyze'
};

async function request(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function getHealth() { return request(`${WILL_API.baseUrl}${WILL_API.healthPath}`); }

export function getMarketSnapshot(asset = 'EUR/USD', timeframe = '1min') {
  const query = new URLSearchParams({ asset, timeframe, outputsize: '50' });
  return request(`${WILL_API.baseUrl}${WILL_API.marketPath}?${query}`);
}

export function analyzeMarket(market, context = {}) {
  return request(`${WILL_API.baseUrl}${WILL_API.analyzePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ market, context })
  });
}
