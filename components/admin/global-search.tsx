"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, Map, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const PAGES = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Jeunes recensés", href: "/admin/jeunes", icon: Users },
  { label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 },
  { label: "Cartographie", href: "/admin/cartographie", icon: Map },
  { label: "Rapports", href: "/admin/rapports", icon: FileText },
];

/** Recherche globale (⌘K) : pages + recherche d'un jeune par nom/téléphone/code. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const pages = PAGES.filter((p) => !q || p.label.toLowerCase().includes(q));

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hidden h-9 w-72 justify-start gap-2 sm:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm">Rechercher un jeune, une page…</span>
        <kbd className="border-border bg-muted rounded border px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="Rechercher"
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Recherche"
        description="Rechercher une page ou un jeune"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nom, téléphone, identifiant ou page…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            {query.trim().length >= 2 ? (
              <CommandGroup heading="Jeunes recensés">
                <CommandItem
                  value={`search-${query}`}
                  onSelect={() => go(`/admin/jeunes?q=${encodeURIComponent(query.trim())}`)}
                >
                  <Search />
                  Rechercher « {query.trim()} » parmi les jeunes
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {pages.map((p) => (
                <CommandItem key={p.href} value={p.label} onSelect={() => go(p.href)}>
                  <p.icon />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
