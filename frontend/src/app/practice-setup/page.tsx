import { Suspense } from "react";
import ScorecardsClient from "./PracticeSetupPage";

export default function PracticeSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScorecardsClient />
    </Suspense>
  );
}