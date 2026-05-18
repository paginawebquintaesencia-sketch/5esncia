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

type ArtistRow = {
  id: string;
  name: string | null;
  role: string | null;
  instagram: string | null;
};

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function parseTags(input: string) {
  return input
    .split(/[,\n|]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [artistRole, setArtistRole] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [youtube, setYoutube] = React.useState("");
  const [tags, setTags] = React.useState("");

  const [artists, setArtists] = React.useState<ArtistRow[]>([]);
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
          setArtists([]);
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
          .from("artists")
          .select("id,name,role,instagram")
          .order("created_at", { ascending: false })
          .limit(200);
        if (!isAlive) return;
        setArtists(Array.isArray(rows) ? (rows as unknown as ArtistRow[]) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setArtists([]);
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
        .from("artists")
        .select("id,name,role,instagram")
        .order("created_at", { ascending: false })
        .limit(200);
      setArtists(Array.isArray(rows) ? (rows as unknown as ArtistRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
      setArtists([]);
    }
  }, []);

  const onCreate = React.useCallback(async () => {
    setActionMessage(null);
    setLoadError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setActionMessage("Escribe el nombre del artista.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      const { error } = await supabase.from("artists").insert({
        name: cleanName,
        role: artistRole.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        youtube: youtube.trim() || null,
        tags: parseTags(tags),
        created_by: user?.id ?? null,
      });
      if (error) throw new Error(error.message);

      setName("");
      setArtistRole("");
      setBio("");
      setAvatarUrl("");
      setWebsite("");
      setInstagram("");
      setYoutube("");
      setTags("");
      setActionMessage("Artista agregado.");
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
    } finally {
      setIsSaving(false);
    }
  }, [artistRole, avatarUrl, bio, instagram, name, reload, tags, website, youtube]);

  return (
    <ApplicationShell09 title="Panel: Artistas" subtitle="Administración">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>Solo administradores pueden agregar artistas.</CardDescription>
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
                <CardTitle>Nuevo artista</CardTitle>
                <CardDescription>Se mostrará en la sección de artistas.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Nombre</div>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Rol (opcional)</div>
                    <Input value={artistRole} onChange={(e) => setArtistRole(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Bio (opcional)</div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Avatar (URL)</div>
                    <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Sitio (URL)</div>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Instagram (URL)</div>
                    <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">YouTube (URL)</div>
                    <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Tags (opcional)</div>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="pintura, cerámica, ilustración"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onCreate} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Agregar artista"}
                  </Button>
                  <Button variant="outline" onClick={reload}>
                    Actualizar lista
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/plataforma/artistas">Ver artistas</a>
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
                <CardTitle>Artistas</CardTitle>
                <CardDescription>{artists.length} registrados</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {artists.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-6">Nombre</div>
                      <div className="col-span-3">Rol</div>
                      <div className="col-span-3">Instagram</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {artists.map((row) => (
                        <div key={row.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-6 truncate">{row.name ?? "—"}</div>
                          <div className="col-span-3 truncate text-muted-foreground">
                            {row.role ?? "—"}
                          </div>
                          <div className="col-span-3 truncate text-muted-foreground">
                            {row.instagram ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay artistas todavía.</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}

