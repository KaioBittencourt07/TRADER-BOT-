export const WILL_API = {
  baseUrl: window.WILL_API_BASE_URL || '',
  healthPath: '/health',
  analyzePath: '/api/analyze'
};

export async function getHealth() {
  const response = await fetch(`${WILL_API.baseUrl}${WILL_API.healthPath}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Health HTTP ${response.status}`);
  return response.json();
}

export async function analyzeMarket(market, context = {}) {
  const response = await fetch(`${WILL_API.baseUrl}${WILL_API.analyzePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ market, context })
  });
  if (!response.ok) throw new Error(`Analyze HTTP ${response.status}`);
  return response.json();
}
