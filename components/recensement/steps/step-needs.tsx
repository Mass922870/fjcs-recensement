"use client";

import { MultiChoice } from "@/components/recensement/multi-choice";
import { StepIntro } from "@/components/recensement/fields";
import type { NeedOption } from "@/services/referentials.service";

export function StepNeeds({ needs }: { needs: NeedOption[] }) {
  return (
    <div className="space-y-6">
      <StepIntro>
        Cochez toutes les situations qui vous concernent. Ces réponses orientent directement les
        programmes du FJCS : formations, accompagnement, mise en relation.
      </StepIntro>
      <MultiChoice
        name="needs.needSlugs"
        options={needs.map((n) => ({ slug: n.slug, label: n.question || n.label }))}
        columns={1}
      />
    </div>
  );
}
