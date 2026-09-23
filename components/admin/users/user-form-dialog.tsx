"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROLE_LABELS } from "@/lib/constants/referentials";
import { MANAGEMENT_ROLE_DESCRIPTIONS, MANAGEMENT_ROLE_LABELS } from "@/lib/auth/management-rbac";
import { MANAGEMENT_NAME } from "@/lib/constants/app";
import type { ManagementRole, Role } from "@/lib/generated/prisma/enums";
import { createUserAction, resetUserPasswordAction, updateUserAction } from "@/actions/users";
import type { ActionResult } from "@/lib/action-result";

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const MANAGEMENT_ROLES = Object.keys(MANAGEMENT_ROLE_LABELS) as ManagementRole[];
/** Valeur sentinelle : un <SelectItem> ne peut pas porter une valeur vide. */
const NO_MANAGEMENT = "__aucun__";

const ROLE_HINTS: Record<Role, string> = {
  SUPER_ADMIN: "Tout accès, y compris utilisateurs et suppression définitive.",
  ADMIN: "Gestion des données, exports nominatifs, paramètres.",
  ANALYST: "Statistiques, rapports et exports anonymisés.",
  VIEWER: "Lecture seule des tableaux de bord et des fiches (coordonnées masquées).",
};

type Errors = Record<string, string[] | undefined>;

function useSubmit(onDone: () => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const submit = (fn: () => Promise<ActionResult<unknown>>, success: string) => {
    setErrors({});
    setGlobalError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        onDone();
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) setGlobalError(res.error);
        else toast.error(res.error);
      }
    });
  };
  return { pending, errors, globalError, submit };
}

export function CreateUserDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("VIEWER");
  const { pending, errors, globalError, submit } = useSubmit(() => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            submit(
              () =>
                createUserAction({
                  name: fd.get("name"),
                  email: fd.get("email"),
                  role,
                  password: fd.get("password"),
                }),
              "Utilisateur créé.",
            );
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Le compte est actif immédiatement. Communiquez le mot de passe par un canal sûr.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="u-name">Nom complet</FieldLabel>
            <Input id="u-name" name="name" required autoComplete="off" />
            <FieldError>{errors.name?.[0]}</FieldError>
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="u-email">Adresse e-mail</FieldLabel>
            <Input id="u-email" name="email" type="email" required autoComplete="off" />
            <FieldError>{errors.email?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="u-role">Rôle</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="u-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>{ROLE_HINTS[role]}</FieldDescription>
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="u-password">Mot de passe initial</FieldLabel>
            <Input
              id="u-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
            <FieldDescription>10 caractères minimum, lettres et chiffres.</FieldDescription>
            <FieldError>{errors.password?.[0]}</FieldError>
          </Field>
          {globalError ? <p className="text-destructive text-sm">{globalError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              Créer le compte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditUserProps {
  user: {
    id: string;
    name: string;
    role: Role;
    isActive: boolean;
    managementRole: ManagementRole | null;
  };
  isSelf: boolean;
  children: React.ReactNode;
}

export function EditUserDialog({ user, isSelf, children }: EditUserProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [managementRole, setManagementRole] = useState<string>(
    user.managementRole ?? NO_MANAGEMENT,
  );
  const { pending, errors, globalError, submit } = useSubmit(() => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            submit(
              () =>
                updateUserAction(user.id, {
                  name: fd.get("name"),
                  role,
                  isActive,
                  managementRole: managementRole === NO_MANAGEMENT ? "" : managementRole,
                }),
              "Utilisateur mis à jour.",
            );
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              {isSelf
                ? "Vous modifiez votre propre compte."
                : "Le rôle s'applique à la prochaine connexion."}
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="e-name">Nom complet</FieldLabel>
            <Input id="e-name" name="name" defaultValue={user.name} required />
            <FieldError>{errors.name?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="e-role">Rôle</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSelf}>
              <SelectTrigger id="e-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {isSelf ? "Vous ne pouvez pas modifier votre propre rôle." : ROLE_HINTS[role]}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="e-management-role">{MANAGEMENT_NAME}</FieldLabel>
            <Select value={managementRole} onValueChange={setManagementRole}>
              <SelectTrigger id="e-management-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MANAGEMENT}>Aucun accès</SelectItem>
                {MANAGEMENT_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {MANAGEMENT_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {managementRole === NO_MANAGEMENT
                ? "Ce compte ne voit pas l'espace interne du bureau."
                : MANAGEMENT_ROLE_DESCRIPTIONS[managementRole as ManagementRole]}
            </FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Switch
              id="e-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSelf}
            />
            <FieldLabel htmlFor="e-active">Compte actif</FieldLabel>
          </Field>
          {globalError ? <p className="text-destructive text-sm">{globalError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({
  userId,
  userName,
  children,
}: {
  userId: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pending, errors, globalError, submit } = useSubmit(() => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            submit(
              () => resetUserPasswordAction(userId, { password: fd.get("password") }),
              "Mot de passe réinitialisé.",
            );
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Pour {userName}. Le compte est également déverrouillé.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="r-password">Nouveau mot de passe</FieldLabel>
            <Input
              id="r-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
            <FieldError>{errors.password?.[0]}</FieldError>
          </Field>
          {globalError ? <p className="text-destructive text-sm">{globalError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              Réinitialiser
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
