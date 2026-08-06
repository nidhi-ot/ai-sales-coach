import { Suspense } from "react";
import CallPage from "./CallPageClient";
import CallLoadingFallback from "./CallLoadingFallback";

export default function CallPageclients() {
  return (
    <Suspense fallback={<CallLoadingFallback />}>
      <CallPage />
    </Suspense>
  );
}
