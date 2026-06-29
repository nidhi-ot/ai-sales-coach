import { Suspense } from "react";
import PracticeSetupContent from "./PracticeSetupPage";

export default function PracticePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PracticeSetupContent />
    </Suspense>
  );
}