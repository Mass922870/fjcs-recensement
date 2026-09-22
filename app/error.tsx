"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/states";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-page flex min-h-screen items-center">
      <ErrorState
        className="w-full"
        action={
          <Button variant="outline" onClick={reset}>
            Réessayer
          </Button>
        }
      />
    </main>
  );
}
