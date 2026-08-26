export function resolveConsensus(deterministic, ai, { minimumAiConfidence = 70 } = {}) {
  const agrees = ai?.direction === deterministic?.direction;
  const strongEnough = Number(ai?.confidence) >= minimumAiConfidence;
  const approved = Boolean(deterministic?.executable) && !ai?.block && agrees && strongEnough;
  if (!approved) {
    return {
      approved: false,
      decision: {
        ...deterministic,
        direction: 'WAIT',
        executable: false,
        clickTime: null,
        blocked: true,
        reason: 'Consenso não confirmado entre WILL determinístico e AI.',
        blockReasons: [...(deterministic?.blockReasons ?? []), 'AI_CONSENSUS_FAILED']
      }
    };
  }
  return {
    approved: true,
    decision: {
      ...deterministic,
      confidence: Math.round((Number(deterministic.confidence ?? 0) + Number(ai.confidence ?? 0)) / 2),
      reason: `Consenso WILL + AI: ${ai.thesis}`,
      ai: { direction: ai.direction, confidence: ai.confidence, score: ai.score, risks: ai.risks },
      clickTime: new Date().toISOString()
    }
  };
}
