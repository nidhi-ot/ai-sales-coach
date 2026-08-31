import { Suspense } from "react";
import PracticeSetupPage from "./PracticeSetupPage";
import PracticeSetupLoadingFallback from "./PracticeSetupLoadingFallback";

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeSetupLoadingFallback />}>
      <PracticeSetupPage />
    </Suspense>
  );
}
