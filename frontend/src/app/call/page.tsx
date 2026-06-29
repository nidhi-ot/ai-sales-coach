import { Suspense } from "react";
import ScorecardsClient from "./CallPageClient";

export default function CallPageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScorecardsClient />
    </Suspense>
  );
}