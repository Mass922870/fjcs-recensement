"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/states";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      action={
        <Button variant="outline" onClick={reset}>
          Réessayer
        </Button>
      }
    />
  );
}
