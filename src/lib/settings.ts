import { defaultWeights, type ScoreWeights } from "@/lib/scoring";

let scoreWeights: ScoreWeights = { ...defaultWeights };

export function getScoreWeights() {
  return scoreWeights;
}

export function updateScoreWeights(next: Partial<ScoreWeights>) {
  scoreWeights = { ...scoreWeights, ...next };
  return scoreWeights;
}
