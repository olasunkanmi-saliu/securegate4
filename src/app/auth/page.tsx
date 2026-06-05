import { Suspense } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { AuthContent } from "./AuthContent";

export default function AuthPage(): JSX.Element {
  return (
    <Suspense fallback={<LoadingSpinner centered />}>
      <AuthContent />
    </Suspense>
  );
}
