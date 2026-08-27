const WS_BASE_URL = 'wss://ws.twelvedata.com/v1/quotes/price';

let connection = null;
let reconnectTimer = null;
const latest = new Map();
const waiters = new Map();

function notify(symbol, tick) {
  latest.set(symbol, tick);
  const pending = waiters.get(symbol);
  if (!pending) return;
  waiters.delete(symbol);
  for (const resolve of pending) resolve(tick);
}

function scheduleReconnect(apiKey) {
  if (reconnectTimer || !apiKey) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(apiKey);
  }, 3000);
}

function connect(apiKey) {
  if (connection && (connection.readyState === 0 || connection.readyState === 1)) return connection;
  if (typeof globalThis.WebSocket !== 'function') {
    throw new Error('WebSocket nativo não disponível no Node.');
  }

  const ws = new globalThis.WebSocket(`${WS_BASE_URL}?apikey=${encodeURIComponent(apiKey)}`);
  connection = ws;

  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: 'subscribe',
      params: { symbols: 'EUR/USD' }
    }));
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(String(event.data));
      if (message.event !== 'price' || !message.symbol || message.price == null || message.timestamp == null) return;
      const tick = {
        asset: message.symbol,
        price: Number(message.price),
        timestamp: new Date(Number(message.timestamp) * 1000).toISOString(),
        source: 'twelvedata-websocket'
      };
      if (Number.isFinite(tick.price)) notify(message.symbol, tick);
    } catch {
      // Ignore malformed/non-price events.
    }
  };

  ws.onerror = () => {
    try { ws.close(); } catch {}
  };

  ws.onclose = () => {
    if (connection === ws) connection = null;
    scheduleReconnect(apiKey);
  };

  return ws;
}

export function createTwelveDataStream({ apiKey = process.env.TWELVEDATA_API_KEY, timeoutMs = 8000 } = {}) {
  if (!apiKey) throw new Error('TWELVEDATA_API_KEY não configurada.');

  return {
    async getLatest(asset = 'EUR/USD') {
      if (asset !== 'EUR/USD') {
        throw new Error('Stream atual configurado para EUR/USD.');
      }
      connect(apiKey);
      const cached = latest.get(asset);
      if (cached && Date.now() - Date.parse(cached.timestamp) <= timeoutMs) return cached;

      return await new Promise((resolve, reject) => {
        const list = waiters.get(asset) || [];
        list.push(resolve);
        waiters.set(asset, list);
        setTimeout(() => {
          const pending = waiters.get(asset);
          if (!pending) return;
          waiters.delete(asset);
          reject(new Error('Twelve Data WebSocket não entregou um tick dentro do prazo.'));
        }, timeoutMs);
      });
    }
  };
}
