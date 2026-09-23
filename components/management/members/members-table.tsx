"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Mail, MoreHorizontal, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberFormDialog } from "./member-form-dialog";
import { MEMBER_STATUS_LABELS, MEMBER_STATUS_STYLES } from "@/lib/constants/management";
import { MANAGEMENT_ROLE_LABELS } from "@/lib/auth/management-rbac";
import { archiveMemberAction } from "@/actions/management/members";
import type { CommissionRow, MemberRow } from "@/services/management/members.service";
import { cn } from "@/lib/utils";

interface Props {
  members: MemberRow[];
  commissions: CommissionRow[];
  canManage: boolean;
}

export function MembersTable({ members, commissions, canManage }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toArchive, setToArchive] = useState<MemberRow | null>(null);

  const confirmArchive = () => {
    if (!toArchive) return;
    const id = toArchive.id;
    start(async () => {
      const res = await archiveMemberAction(id);
      if (res.ok) {
        toast.success("Membre archivé.");
        setToArchive(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      {/* Tableau sur grand écran, cartes empilées sur téléphone. */}
      <div className="border-border hidden overflow-hidden rounded-2xl border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Fonction</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              {canManage ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <p className="text-foreground font-medium">
                    {m.lastName} {m.firstName}
                  </p>
                  {m.user ? (
                    <p className="text-muted-foreground text-xs">
                      Compte :{" "}
                      {m.user.managementRole
                        ? MANAGEMENT_ROLE_LABELS[m.user.managementRole]
                        : "sans accès interne"}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">Sans compte</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{m.role ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {m.commission?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div className="space-y-0.5">
                    {m.phone ? (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3" aria-hidden />
                        {m.phone}
                      </p>
                    ) : null}
                    {m.email ? (
                      <p className="flex items-center gap-1.5">
                        <Mail className="size-3" aria-hidden />
                        {m.email}
                      </p>
                    ) : null}
                    {!m.phone && !m.email ? "—" : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(MEMBER_STATUS_STYLES[m.status])}>
                    {MEMBER_STATUS_LABELS[m.status]}
                  </Badge>
                </TableCell>
                {canManage ? (
                  <TableCell>
                    <RowActions
                      member={m}
                      commissions={commissions}
                      onArchive={() => setToArchive(m)}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {members.map((m) => (
          <li key={m.id} className="border-border rounded-2xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-foreground font-medium">
                  {m.lastName} {m.firstName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {m.role ?? "Fonction non précisée"}
                  {m.commission ? ` · ${m.commission.name}` : ""}
                </p>
              </div>
              {canManage ? (
                <RowActions
                  member={m}
                  commissions={commissions}
                  onArchive={() => setToArchive(m)}
                />
              ) : null}
            </div>
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {m.phone ? <span>{m.phone}</span> : null}
              {m.email ? <span className="truncate">{m.email}</span> : null}
            </div>
            <Badge variant="outline" className={cn("mt-3", MEMBER_STATUS_STYLES[m.status])}>
              {MEMBER_STATUS_LABELS[m.status]}
            </Badge>
          </li>
        ))}
      </ul>

      <AlertDialog open={Boolean(toArchive)} onOpenChange={(o) => !o && setToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archiver {toArchive?.firstName} {toArchive?.lastName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le membre sort des listes de convocation mais reste dans l&apos;historique des
              présences, des actions et des procès-verbaux. Rien n&apos;est supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={confirmArchive}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RowActions({
  member,
  commissions,
  onArchive,
}: {
  member: MemberRow;
  commissions: CommissionRow[];
  onArchive: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions sur ${member.lastName}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <MemberFormDialog commissions={commissions} member={member}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil />
            Modifier
          </DropdownMenuItem>
        </MemberFormDialog>
        {member.status !== "ARCHIVE" ? (
          <DropdownMenuItem variant="destructive" onSelect={onArchive}>
            <Archive />
            Archiver
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
