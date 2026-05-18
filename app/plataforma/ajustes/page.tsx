"use client";

import * as React from "react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Button } from "@/plataforma/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/plataforma/components/ui/card";

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function roleLabel(isAdmin: boolean) {
  return isAdmin ? "Administrador" : "Usuario";
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isAlive = true;

    async function run() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user ?? null;
        if (!isAlive) return;
        setEmail(user?.email ?? null);
        setUserId(user?.id ?? null);
        setRole(normalizeRole(user?.user_metadata?.role) ?? null);

        if (!user) {
          setRoleFromDb(null);
          return;
        }

        const { data: roleRows } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .limit(1);
        const rawRole =
          Array.isArray(roleRows) && roleRows[0]
            ? (roleRows[0] as { role?: unknown }).role
            : null;
        if (!isAlive) return;
        setRoleFromDb(normalizeRole(rawRole) ?? null);
      } finally {
        if (!isAlive) return;
        setIsLoading(false);
      }
    }

    run();
    return () => {
      isAlive = false;
    };
  }, []);

  const isAdminEmail = React.useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    if (!raw || !email) return false;
    const list = raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  }, [email]);

  const roleCandidate = roleFromDb ?? role;
  const isAdmin =
    isAdminEmail ||
    roleCandidate === "admin" ||
    roleCandidate === "administrador" ||
    roleCandidate === "superadmin";

  return (
    <ApplicationShell09 title="Ajustes" subtitle="Configuración">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>Datos básicos de tu sesión</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{email ?? (isLoading ? "Cargando..." : "—")}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-medium">{roleLabel(isAdmin)}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{userId ?? (isLoading ? "…" : "—")}</span>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Administración</CardTitle>
              <CardDescription>
                Tu cuenta tiene permisos para agregar contenido en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/plataforma/panel">Ir al panel</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Permisos</CardTitle>
              <CardDescription>
                Para agregar contenido necesitas el rol de Administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pide a un administrador que te habilite el rol.
            </CardContent>
          </Card>
        )}
      </div>
    </ApplicationShell09>
  );
}
