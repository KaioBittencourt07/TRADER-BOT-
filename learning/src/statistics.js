export function summarize(records = []) {
  const completed = records.filter((r) => r?.outcome === 'WIN' || r?.outcome === 'LOSS');
  const wins = completed.filter((r) => r.outcome === 'WIN').length;
  const losses = completed.length - wins;
  const winRate = completed.length ? wins / completed.length : null;

  const by = (field) => {
    const groups = new Map();
    for (const record of completed) {
      const key = record[field] ?? 'UNKNOWN';
      const item = groups.get(key) ?? { key, total: 0, wins: 0 };
      item.total += 1;
      if (record.outcome === 'WIN') item.wins += 1;
      groups.set(key, item);
    }
    return [...groups.values()].map((item) => ({ ...item, winRate: item.wins / item.total }));
  };

  return {
    total: completed.length,
    wins,
    losses,
    winRate,
    byAsset: by('asset'),
    byRegime: by('regime'),
    bySetup: by('setup'),
    byTimeframe: by('timeframe')
  };
}
