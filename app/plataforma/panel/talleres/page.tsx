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

type WorkshopRow = {
  id: string;
  title: string | null;
  starts_at: string | null;
};

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function toIsoOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.valueOf())) return null;
  return date.toISOString();
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");

  const [workshops, setWorkshops] = React.useState<WorkshopRow[]>([]);
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
          setWorkshops([]);
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

        const { data: rows } = await supabase
          .from("workshops")
          .select("id,title,starts_at")
          .order("starts_at", { ascending: false })
          .limit(200);
        if (!isAlive) return;
        setWorkshops(Array.isArray(rows) ? (rows as unknown as WorkshopRow[]) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setWorkshops([]);
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
      const { data: rows } = await supabase
        .from("workshops")
        .select("id,title,starts_at")
        .order("starts_at", { ascending: false })
        .limit(200);
      setWorkshops(Array.isArray(rows) ? (rows as unknown as WorkshopRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
      setWorkshops([]);
    }
  }, []);

  const onCreate = React.useCallback(async () => {
    setActionMessage(null);
    setLoadError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setActionMessage("Escribe un título.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      const { error } = await supabase.from("workshops").insert({
        title: cleanTitle,
        description: description.trim() || null,
        starts_at: toIsoOrNull(startsAt),
        location: location.trim() || null,
        cover_url: coverUrl.trim() || null,
        created_by: user?.id ?? null,
      });
      if (error) throw new Error(error.message);

      setTitle("");
      setDescription("");
      setStartsAt("");
      setLocation("");
      setCoverUrl("");
      setActionMessage("Taller agregado.");
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
    } finally {
      setIsSaving(false);
    }
  }, [coverUrl, description, location, reload, startsAt, title]);

  return (
    <ApplicationShell09 title="Panel: Talleres" subtitle="Administración">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>Solo administradores pueden agregar talleres.</CardDescription>
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
                <CardTitle>Nuevo taller</CardTitle>
                <CardDescription>Luego los usuarios podrán inscribirse.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Título</div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Descripción</div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Fecha (opcional)</div>
                    <Input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Lugar (opcional)</div>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Portada (URL)</div>
                  <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onCreate} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Agregar taller"}
                  </Button>
                  <Button variant="outline" onClick={reload}>
                    Actualizar lista
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
                <CardTitle>Talleres</CardTitle>
                <CardDescription>{workshops.length} registrados</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {workshops.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-8">Título</div>
                      <div className="col-span-4">Fecha</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {workshops.map((row) => (
                        <div key={row.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-8 truncate">{row.title ?? "—"}</div>
                          <div className="col-span-4 truncate text-muted-foreground">
                            {row.starts_at ? new Date(row.starts_at).toLocaleString("es-MX") : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay talleres todavía.</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}

