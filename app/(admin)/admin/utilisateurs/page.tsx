import type { Metadata } from "next";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import {
  CreateUserDialog,
  EditUserDialog,
  ResetPasswordDialog,
} from "@/components/admin/users/user-form-dialog";
import { requirePagePermission } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants/referentials";
import { listUsers } from "@/services/users.service";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  const me = await requirePagePermission("users:manage");
  const users = await listUsers();

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Comptes ayant accès à l'espace administration et leurs rôles."
        actions={
          <CreateUserDialog>
            <Button>
              <Plus data-icon="inline-start" />
              Nouvel utilisateur
            </Button>
          </CreateUserDialog>
        }
      />
      <div className="border-border overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const locked = u.lockedUntil && u.lockedUntil > new Date();
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="text-foreground font-medium">
                        {u.name}{" "}
                        {u.id === me.id ? (
                          <span className="text-muted-foreground text-xs">(vous)</span>
                        ) : null}
                      </p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      {!u.isActive ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Désactivé
                        </Badge>
                      ) : locked ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-800"
                        >
                          Verrouillé
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-100 bg-green-50 text-green-700"
                        >
                          Actif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.lastLoginAt
                        ? formatDistanceToNow(u.lastLoginAt, { addSuffix: true, locale: fr })
                        : "Jamais"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <EditUserDialog
                          user={{ id: u.id, name: u.name, role: u.role, isActive: u.isActive }}
                          isSelf={u.id === me.id}
                        >
                          <Button variant="ghost" size="icon" aria-label={`Modifier ${u.name}`}>
                            <Pencil />
                          </Button>
                        </EditUserDialog>
                        <ResetPasswordDialog userId={u.id} userName={u.name}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Réinitialiser le mot de passe de ${u.name}`}
                          >
                            <KeyRound />
                          </Button>
                        </ResetPasswordDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
