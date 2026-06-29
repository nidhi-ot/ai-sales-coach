import { Suspense } from "react";
import ScorecardsClient from "./ScorecardClients";

export default function ScorecardsPage() {
  return (
    <Suspense fallback={<div>Loading scorecard...</div>}>
      <ScorecardsClient />
    </Suspense>
  );
}
