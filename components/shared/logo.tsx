import Image from "next/image";
import { cn } from "@/lib/utils";
import { CTNI_LOGO_SRC, LOGO_SRC, ORG_COMMISSION, ORG_NAME } from "@/lib/constants/app";

type LogoOrg = "fjcs" | "ctni";
type LogoVariant = "emblem" | "wordmark";

interface LogoProps {
  /** `fjcs` (par défaut) ou `ctni` (Commission Transformation Numérique et Innovation). */
  org?: LogoOrg;
  /**
   * - `emblem` : le logo rond seul
   * - `wordmark` : logo rond + nom en texte (header, pied de page) - toujours lisible, même petit
   */
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
  /** Masque le texte sur mobile (variante wordmark). */
  compact?: boolean;
}

const SOURCES: Record<LogoOrg, { src: string; alt: string; title: string; subtitle: string }> = {
  fjcs: { src: LOGO_SRC, alt: `Logo ${ORG_NAME}`, title: "FJCS", subtitle: ORG_NAME },
  ctni: {
    src: CTNI_LOGO_SRC,
    alt: `Logo ${ORG_COMMISSION}`,
    title: "CTNI",
    subtitle: ORG_COMMISSION,
  },
};

export function Logo({
  org = "fjcs",
  variant = "emblem",
  className,
  priority,
  compact,
}: LogoProps) {
  const s = SOURCES[org];
  const image = (
    <Image
      src={s.src}
      alt={s.alt}
      width={512}
      height={512}
      priority={priority}
      sizes="(max-width: 768px) 96px, 160px"
      className={cn("aspect-square h-full w-auto rounded-full", variant === "emblem" && className)}
    />
  );

  if (variant === "emblem") return image;

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="h-full shrink-0">{image}</span>
      <span className={cn("min-w-0 leading-tight", compact && "hidden sm:block")}>
        <span className="text-brand-700 block text-base font-bold tracking-tight">{s.title}</span>
        <span className="text-muted-foreground block max-w-[220px] text-[10px] leading-snug font-medium uppercase">
          {s.subtitle}
        </span>
      </span>
    </span>
  );
}
