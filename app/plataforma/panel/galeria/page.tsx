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

type ArtworkRow = {
  id: string;
  title: string | null;
  artist_name: string | null;
  image_url: string | null;
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

  const [title, setTitle] = React.useState("");
  const [artistName, setArtistName] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  const [items, setItems] = React.useState<ArtworkRow[]>([]);
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
          setItems([]);
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
          .from("artworks")
          .select("id,title,artist_name,image_url")
          .order("created_at", { ascending: false })
          .limit(200);
        if (!isAlive) return;
        setItems(Array.isArray(rows) ? (rows as unknown as ArtworkRow[]) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setItems([]);
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
        .from("artworks")
        .select("id,title,artist_name,image_url")
        .order("created_at", { ascending: false })
        .limit(200);
      setItems(Array.isArray(rows) ? (rows as unknown as ArtworkRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
      setItems([]);
    }
  }, []);

  const onCreate = React.useCallback(async () => {
    setActionMessage(null);
    setLoadError(null);

    const cleanTitle = title.trim();
    const cleanArtist = artistName.trim();
    if (!cleanTitle || !cleanArtist) {
      setActionMessage("Completa título y artista.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      const { error } = await supabase.from("artworks").insert({
        title: cleanTitle,
        artist_name: cleanArtist,
        image_url: imageUrl.trim() || null,
        created_by: user?.id ?? null,
      });
      if (error) throw new Error(error.message);

      setTitle("");
      setArtistName("");
      setImageUrl("");
      setActionMessage("Obra agregada.");
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
    } finally {
      setIsSaving(false);
    }
  }, [artistName, imageUrl, reload, title]);

  return (
    <ApplicationShell09 title="Panel: Galería" subtitle="Administración">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>Solo administradores pueden agregar obras.</CardDescription>
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
                <CardTitle>Nueva obra</CardTitle>
                <CardDescription>Se mostrará en la galería.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Título</div>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Artista</div>
                    <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Imagen (URL)</div>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onCreate} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Agregar"}
                  </Button>
                  <Button variant="outline" onClick={reload}>
                    Actualizar lista
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/plataforma/galeria">Ver galería</a>
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
                <CardTitle>Obras</CardTitle>
                <CardDescription>{items.length} registradas</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {items.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-5">Título</div>
                      <div className="col-span-4">Artista</div>
                      <div className="col-span-3">Imagen</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {items.map((row) => (
                        <div key={row.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-5 truncate">{row.title ?? "—"}</div>
                          <div className="col-span-4 truncate text-muted-foreground">
                            {row.artist_name ?? "—"}
                          </div>
                          <div className="col-span-3 truncate font-mono text-xs text-muted-foreground">
                            {row.image_url ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay obras todavía.</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}

