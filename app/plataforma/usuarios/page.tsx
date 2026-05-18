"use client";

import * as React from "react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Button } from "@/plataforma/components/ui/button";
import { Input } from "@/plataforma/components/ui/input";
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

type ProfileRow = {
  id: string;
  role: string;
  email?: string | null;
};

async function fetchProfiles(supabase: ReturnType<typeof createClient>) {
  const withEmail = await supabase
    .from("profiles")
    .select("id, role, email")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!withEmail.error && Array.isArray(withEmail.data)) {
    return withEmail.data as unknown as ProfileRow[];
  }

  const withoutEmail = await supabase
    .from("profiles")
    .select("id, role")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (withoutEmail.error || !Array.isArray(withoutEmail.data)) return [];
  return withoutEmail.data as unknown as ProfileRow[];
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);
  const [profiles, setProfiles] = React.useState<ProfileRow[]>([]);
  const [profilesError, setProfilesError] = React.useState<string | null>(null);

  const [targetEmail, setTargetEmail] = React.useState("");
  const [targetRole, setTargetRole] = React.useState<"user" | "admin">("user");
  const [isSaving, setIsSaving] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

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

  const loadProfiles = React.useCallback(async () => {
    setProfilesError(null);
    setActionMessage(null);
    try {
      const supabase = createClient();
      const rows = await fetchProfiles(supabase);
      setProfiles(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setProfiles([]);
      setProfilesError(message);
    }
  }, []);

  React.useEffect(() => {
    if (!isAdmin || isLoading) return;
    const handle = setTimeout(() => {
      loadProfiles();
    }, 0);
    return () => clearTimeout(handle);
  }, [isAdmin, isLoading, loadProfiles]);

  const onSaveRole = React.useCallback(async () => {
    const cleanedEmail = targetEmail.trim().toLowerCase();
    if (!cleanedEmail) {
      setActionMessage("Escribe un correo para asignar el rol.");
      return;
    }

    setIsSaving(true);
    setActionMessage(null);
    setProfilesError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_role_by_email", {
        target_email: cleanedEmail,
        next_role: targetRole,
      });
      if (error) {
        throw new Error(error.message);
      }

      setActionMessage("Rol actualizado.");
      await loadProfiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setActionMessage(`No se pudo actualizar: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }, [loadProfiles, targetEmail, targetRole]);

  return (
    <ApplicationShell09 title="Usuarios" subtitle="Gestión de roles y accesos">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>
                Esta sección es solo para administradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="/plataforma">Volver</a>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asignar rol</CardTitle>
                <CardDescription>
                  Cambia el rol por correo (usuario o administrador).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Correo</div>
                  <Input
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="correo@dominio.com"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Rol</div>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value === "admin" ? "admin" : "user")}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onSaveRole} disabled={isSaving}>
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={loadProfiles}>
                    Actualizar lista
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/plataforma/ajustes">Ver mi rol</a>
                  </Button>
                </div>

                {actionMessage ? (
                  <div className="text-sm text-muted-foreground">{actionMessage}</div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                  Lista de perfiles y roles registrados en la base de datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {profilesError ? (
                  <div className="text-sm text-muted-foreground">{profilesError}</div>
                ) : null}

                {profiles.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-5">Correo</div>
                      <div className="col-span-3">Rol</div>
                      <div className="col-span-4">ID</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="grid grid-cols-12 gap-2 px-3 py-2 text-sm"
                        >
                          <div className="col-span-5 truncate">
                            {profile.email ?? "—"}
                          </div>
                          <div className="col-span-3 font-medium">
                            {normalizeRole(profile.role) === "admin" ? "Administrador" : "Usuario"}
                          </div>
                          <div className="col-span-4 truncate font-mono text-xs text-muted-foreground">
                            {profile.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No hay usuarios para mostrar. Asegúrate de tener creada la tabla `profiles` y la política para admin.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}
