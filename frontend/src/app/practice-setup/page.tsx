import { Suspense } from "react";
import PracticeSetupPage from "./PracticeSetupPage";

export default function PracticePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PracticeSetupPage />
    </Suspense>
  );
}
