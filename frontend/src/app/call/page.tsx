import { Suspense } from "react";
import CallPage from "./CallPageClient";

export default function CallPageclients() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallPage />
    </Suspense>
  );
}
