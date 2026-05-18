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

type EventRow = {
  id: string;
  title: string | null;
  starts_at: string | null;
  location: string | null;
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
  const [cost, setCost] = React.useState("");

  const [events, setEvents] = React.useState<EventRow[]>([]);
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
          setEvents([]);
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

        const { data: eventRows } = await supabase
          .from("events")
          .select("id,title,starts_at,location")
          .order("starts_at", { ascending: false })
          .limit(200);

        if (!isAlive) return;
        setEvents(Array.isArray(eventRows) ? (eventRows as unknown as EventRow[]) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setEvents([]);
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
      const { data: eventRows } = await supabase
        .from("events")
        .select("id,title,starts_at,location")
        .order("starts_at", { ascending: false })
        .limit(200);
      setEvents(Array.isArray(eventRows) ? (eventRows as unknown as EventRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
      setEvents([]);
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

    const startsAtIso = toIsoOrNull(startsAt);
    if (!startsAtIso) {
      setActionMessage("Selecciona una fecha y hora.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      const { error } = await supabase.from("events").insert({
        title: cleanTitle,
        description: description.trim() || null,
        starts_at: startsAtIso,
        location: location.trim() || null,
        cost: cost.trim() || null,
        created_by: user?.id ?? null,
      });

      if (error) throw new Error(error.message);

      setTitle("");
      setDescription("");
      setStartsAt("");
      setLocation("");
      setCost("");
      setActionMessage("Evento creado.");
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
    } finally {
      setIsSaving(false);
    }
  }, [cost, description, location, reload, startsAt, title]);

  return (
    <ApplicationShell09 title="Panel: Eventos" subtitle="Administración">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>Solo administradores pueden agregar eventos.</CardDescription>
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
                <CardTitle>Nuevo evento</CardTitle>
                <CardDescription>Se mostrará en el calendario de la plataforma.</CardDescription>
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
                    <div className="text-sm font-medium text-foreground">Fecha y hora</div>
                    <Input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Lugar</div>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Costo</div>
                  <Input value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onCreate} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Crear evento"}
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
                <CardTitle>Eventos</CardTitle>
                <CardDescription>{events.length} registrados</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {events.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-6">Título</div>
                      <div className="col-span-3">Fecha</div>
                      <div className="col-span-3">Lugar</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {events.map((ev) => (
                        <div key={ev.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-6 truncate">{ev.title ?? "—"}</div>
                          <div className="col-span-3 truncate text-muted-foreground">
                            {ev.starts_at ? new Date(ev.starts_at).toLocaleString("es-MX") : "—"}
                          </div>
                          <div className="col-span-3 truncate text-muted-foreground">
                            {ev.location ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No hay eventos todavía.
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

