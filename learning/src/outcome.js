export function resolveOutcome(record, outcome, metadata = {}) {
  if (!['WIN', 'LOSS', 'VOID'].includes(outcome)) throw new Error('Outcome inválido.');
  return { ...record, outcome, resolvedAt: new Date().toISOString(), result: metadata.result ?? null, payout: metadata.payout ?? record.payout ?? null, errorTag: metadata.errorTag ?? record.errorTag ?? null };
}
