// Official KOOS scoring method: for each subscale, take the mean of its
// answered items (0-4, where 4 = worst) and normalize to a 0-100 scale
// where 100 = no problems and 0 = extreme problems.
//
//   subscale score = 100 - (sum of answered items / (items answered * 4)) * 100
//
// Unanswered items are excluded from both the sum and the denominator,
// matching how the official manual handles partial completion.
export function scoreKoosSubscale(itemScores) {
  const answered = itemScores.filter((v) => v !== null && v !== undefined)
  if (answered.length === 0) return null
  const sum = answered.reduce((a, b) => a + b, 0)
  const maxPossible = answered.length * 4
  return Math.round(100 - (sum / maxPossible) * 100)
}

// answersBySubscale: { pain: number[], symptoms: number[], adl: number[], sport: number[], qol: number[] }
// Returns { pain, symptoms, adl, sport, qol, overall } — each 0-100 or null if unanswered.
export function scoreKoos(answersBySubscale) {
  const scores = {}
  for (const key of Object.keys(answersBySubscale)) {
    scores[key] = scoreKoosSubscale(answersBySubscale[key])
  }
  const validScores = Object.values(scores).filter((s) => s !== null)
  const overall = validScores.length
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null
  return { ...scores, overall }
}

// IMPORTANT: KOOS itself does not define a single risk tier — only five
// 0-100 subscale scores. This banding is a placeholder for demo purposes.
// Validate real thresholds with a clinical advisor before treating this as
// an actual triage rule.
export function riskLevelFromOverall(overall) {
  if (overall === null || overall === undefined) return null
  if (overall >= 80) return 'low'
  if (overall >= 50) return 'mid'
  return 'high'
}
