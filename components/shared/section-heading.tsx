import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto text-center", className)}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.14em] text-cyan-600 uppercase">{eyebrow}</p>
      ) : null}
      <Tag className="text-foreground text-2xl font-semibold sm:text-3xl">{title}</Tag>
      {description ? (
        <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
