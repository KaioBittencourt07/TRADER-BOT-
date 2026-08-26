import { classifyRegime } from './marketRegime.js';
import { classifySetup } from './setupClassifier.js';
import { decide } from './willEngine.js';

export function analyzeMarket(data) {
  const regimeResult = classifyRegime(data);
  const setupResult = classifySetup(data, regimeResult.regime);
  const decision = decide(data);

  const blockedByClassification =
    regimeResult.regime === 'UNKNOWN' ||
    setupResult.setup === 'UNKNOWN';

  return {
    ...decision,
    regime: regimeResult.regime,
    regimeConfidence: regimeResult.confidence,
    regimeReason: regimeResult.reason,
    setup: setupResult.setup,
    setupConfidence: setupResult.confidence,
    setupReason: setupResult.reason,
    blocked: decision.blocked || blockedByClassification,
    direction: decision.blocked || blockedByClassification ? 'WAIT' : decision.direction,
    reason: blockedByClassification
      ? 'Classificação de regime/setup insuficiente; entrada bloqueada.'
      : decision.reason
  };
}
