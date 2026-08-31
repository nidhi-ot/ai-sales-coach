import { Suspense } from "react";
import ScorecardsClient from "./ScorecardClients";
import ScorecardLoadingFallback from "./ScorecardLoadingFallback";

export default function ScorecardsPage() {
  return (
    <Suspense fallback={<ScorecardLoadingFallback />}>
      <ScorecardsClient />
    </Suspense>
  );
}
