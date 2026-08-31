export type FrameworkScores = Record<string, unknown> & {
  budget?: number;
  authority?: number;
  need?: number;
  timeline?: number;
};

export type FrameworkMetric = {
  key: string;
  label: string;
  value: number | null | undefined;
};

const FRAMEWORK_DIMENSION_LABELS: Record<string, Record<string, string>> = {
  BANT: {
    budget: "Budget",
    authority: "Authority",
    need: "Need",
    timeline: "Timeline",
  },
  MEDDIC: {
    metrics: "Metrics",
    economic_buyer: "Economic Buyer",
    decision_criteria: "Decision Criteria",
    decision_process: "Decision Process",
    identify_pain: "Identify Pain",
    champion: "Champion",
  },
  SPIN: {
    situation: "Situation",
    problem: "Problem",
    implication: "Implication",
    need_payoff: "Need Payoff",
  },
};

export function frameworkMetrics(
  frameworkScores?: FrameworkScores | null
): { framework: string; metrics: FrameworkMetric[] } {
  const scores = isRecord(frameworkScores) ? frameworkScores : {};
  const framework = resolveFramework(scores);
  const rawScores = isRecord(scores[framework]) ? scores[framework] : scores;
  const labels = FRAMEWORK_DIMENSION_LABELS[framework] ?? labelUnknownDimensions(rawScores);

  return {
    framework,
    metrics: Object.entries(labels).map(([key, label]) => ({
      key,
      label,
      value: numericScore(rawScores[key]),
    })),
  };
}

function resolveFramework(scores: Record<string, unknown>): string {
  for (const framework of Object.keys(FRAMEWORK_DIMENSION_LABELS)) {
    if (isRecord(scores[framework])) {
      return framework;
    }
  }

  return "BANT";
}

function labelUnknownDimensions(scores: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.keys(scores).map((key) => [
      key,
      key
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    ])
  );
}

function numericScore(value: unknown): number | null | undefined {
  return typeof value === "number" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
