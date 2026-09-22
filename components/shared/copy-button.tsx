"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  value: string;
  label: string;
  children: React.ReactNode;
}

export function CopyButton({ value, label, children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copié dans le presse-papiers.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier automatiquement.");
    }
  };
  return (
    <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={label}>
      {copied ? <Check className="text-green-600" /> : children}
    </Button>
  );
}
