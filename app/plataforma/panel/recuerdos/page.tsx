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
import { Input } from "@/plataforma/components/ui/input";

type MemoryRow = {
  id: string;
  user_id: string | null;
  workshop_id: string | null;
  workshop_title: string | null;
  image_url: string | null;
  created_at: string | null;
};

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  const [targetEmail, setTargetEmail] = React.useState("");
  const [workshopId, setWorkshopId] = React.useState("");
  const [workshopTitle, setWorkshopTitle] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  const [rows, setRows] = React.useState<MemoryRow[]>([]);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

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

        if (!user) {
          setRoleFromDb(null);
          setRows([]);
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
        setRoleFromDb(normalizeRole(rawRole));

        const { data: memoryRows } = await supabase
          .from("memories")
          .select("id,user_id,workshop_id,workshop_title,image_url,created_at")
          .order("created_at", { ascending: false })
          .limit(200);
        if (!isAlive) return;
        setRows(Array.isArray(memoryRows) ? (memoryRows as unknown as MemoryRow[]) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setRows([]);
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

  const isAdmin = isAdminEmail || roleFromDb === "admin";

  const reload = React.useCallback(async () => {
    setActionMessage(null);
    setLoadError(null);
    try {
      const supabase = createClient();
      const { data: memoryRows } = await supabase
        .from("memories")
        .select("id,user_id,workshop_id,workshop_title,image_url,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows(Array.isArray(memoryRows) ? (memoryRows as unknown as MemoryRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
      setRows([]);
    }
  }, []);

  const onCreate = React.useCallback(async () => {
    setActionMessage(null);
    setLoadError(null);

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setActionMessage("Escribe el correo del usuario.");
      return;
    }
    const cleanImageUrl = imageUrl.trim();
    if (!cleanImageUrl) {
      setActionMessage("Escribe la URL de la foto.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id,email")
        .eq("email", cleanEmail)
        .limit(1);

      if (profileError) throw new Error(profileError.message);
      const targetUserId =
        Array.isArray(profileRows) && profileRows[0]
          ? (profileRows[0] as { id?: string }).id ?? null
          : null;

      if (!targetUserId) {
        throw new Error("No existe ese correo en profiles.");
      }

      const { data } = await supabase.auth.getUser();
      const adminUser = data.user ?? null;

      const { error } = await supabase.from("memories").insert({
        user_id: targetUserId,
        workshop_id: workshopId.trim() || null,
        workshop_title: workshopTitle.trim() || null,
        image_url: cleanImageUrl,
        created_by: adminUser?.id ?? null,
      });

      if (error) throw new Error(error.message);

      setTargetEmail("");
      setWorkshopId("");
      setWorkshopTitle("");
      setImageUrl("");
      setActionMessage("Foto agregada a recuerdos.");
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
    } finally {
      setIsSaving(false);
    }
  }, [imageUrl, reload, targetEmail, workshopId, workshopTitle]);

  return (
    <ApplicationShell09 title="Panel: Recuerdos" subtitle="Administración">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>Solo administradores pueden subir recuerdos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="/plataforma/panel">Volver al panel</a>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nueva foto</CardTitle>
                <CardDescription>Se asigna a un usuario y un taller.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Correo del usuario</div>
                  <Input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Taller ID (opcional)</div>
                    <Input value={workshopId} onChange={(e) => setWorkshopId(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Taller (opcional)</div>
                    <Input
                      value={workshopTitle}
                      onChange={(e) => setWorkshopTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Foto (URL)</div>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onCreate} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Agregar foto"}
                  </Button>
                  <Button variant="outline" onClick={reload}>
                    Actualizar lista
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/plataforma/recuerdos">Ver recuerdos</a>
                  </Button>
                </div>

                {actionMessage ? (
                  <div className="text-sm text-muted-foreground">{actionMessage}</div>
                ) : null}
                {loadError ? (
                  <div className="text-sm text-muted-foreground">{loadError}</div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recuerdos</CardTitle>
                <CardDescription>{rows.length} fotos registradas</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {rows.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-3">Usuario</div>
                      <div className="col-span-3">Taller</div>
                      <div className="col-span-4">Foto</div>
                      <div className="col-span-2">Fecha</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {rows.map((row) => (
                        <div key={row.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-3 truncate font-mono text-xs text-muted-foreground">
                            {row.user_id ?? "—"}
                          </div>
                          <div className="col-span-3 truncate text-muted-foreground">
                            {row.workshop_title ?? row.workshop_id ?? "—"}
                          </div>
                          <div className="col-span-4 truncate font-mono text-xs text-muted-foreground">
                            {row.image_url ?? "—"}
                          </div>
                          <div className="col-span-2 truncate text-muted-foreground">
                            {row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay fotos todavía.</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}

