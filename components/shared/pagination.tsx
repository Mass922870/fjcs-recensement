import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  /** Construit l'URL d'une page en conservant les autres paramètres. */
  hrefFor: (page: number) => string;
}

export function Pagination({ page, pageCount, total, perPage, hrefFor }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const nf = new Intl.NumberFormat("fr-FR");

  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);

  return (
    <nav
      aria-label="Pagination"
      className="border-border flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-muted-foreground">
        {total === 0
          ? "Aucun résultat"
          : `${nf.format(from)}–${nf.format(to)} sur ${nf.format(total)}`}
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={hrefFor(page - 1)} disabled={page <= 1} aria-label="Page précédente">
          <ChevronLeft className="size-4" />
        </PageLink>
        {list.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && list[i - 1]! < p - 1 ? (
              <span className="text-muted-foreground px-1">…</span>
            ) : null}
            <PageLink
              href={hrefFor(p)}
              active={p === page}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </PageLink>
          </span>
        ))}
        <PageLink href={hrefFor(page + 1)} disabled={page >= pageCount} aria-label="Page suivante">
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  active,
  children,
  ...rest
}: {
  href: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page";
}) {
  const cls = cn(
    "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors",
    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) {
    return (
      <span className={cls} aria-disabled {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
