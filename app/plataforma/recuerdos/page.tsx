"use client";

import * as React from "react";
import Image from "next/image";
import { CameraIcon, SearchIcon } from "lucide-react";

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
import { Skeleton } from "@/plataforma/components/ui/skeleton";

type MemoryPhoto = {
  id: string;
  workshopId: string | null;
  workshopTitle: string | null;
  imageUrl: string;
  takenAt: Date | null;
  raw: Record<string, unknown>;
};

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNonEmptyString(record[key]);
    if (value) return value;
  }
  return null;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  const asString = asNonEmptyString(value);
  if (!asString) return null;
  const date = new Date(asString);
  if (Number.isNaN(date.valueOf())) return null;
  return date;
}

function normalizeMemoryPhoto(record: Record<string, unknown>): MemoryPhoto | null {
  const imageUrl = pickString(record, [
    "image_url",
    "imagen_url",
    "foto_url",
    "url",
    "public_url",
    "photo_url",
  ]);
  if (!imageUrl) return null;

  const id =
    pickString(record, ["id", "uuid", "foto_id", "photo_id", "recuerdo_id"]) ??
    crypto.randomUUID();

  const workshopId = pickString(record, ["taller_id", "workshop_id", "evento_id"]);
  const workshopTitle = pickString(record, [
    "taller",
    "taller_nombre",
    "taller_titulo",
    "workshop_title",
    "workshop",
    "titulo_taller",
  ]);

  const takenAt =
    parseDate(record["taken_at"] ?? record["fecha"] ?? record["created_at"]) ?? null;

  return {
    id,
    workshopId,
    workshopTitle,
    imageUrl,
    takenAt,
    raw: record,
  };
}

async function tryFetchMemoryRows({
  supabase,
  tableCandidates,
  userId,
  userEmail,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
  userId: string;
  userEmail: string | null;
}) {
  const userIdColumns = ["user_id", "usuario_id", "owner_id"];
  const emailColumns = ["email", "user_email", "usuario_email"];

  for (const table of tableCandidates) {
    for (const col of userIdColumns) {
      const { data, error } = await supabase.from(table).select("*").eq(col, userId).limit(500);
      if (error) continue;
      if (!Array.isArray(data)) continue;
      return data.filter((row): row is Record<string, unknown> => Boolean(row));
    }

    if (userEmail) {
      for (const col of emailColumns) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq(col, userEmail)
          .limit(500);
        if (error) continue;
        if (!Array.isArray(data)) continue;
        return data.filter((row): row is Record<string, unknown> => Boolean(row));
      }
    }
  }

  return [];
}

function groupByWorkshop(items: MemoryPhoto[]) {
  const groups = new Map<
    string,
    { key: string; title: string; items: MemoryPhoto[]; sortKey: string }
  >();

  for (const item of items) {
    const key = item.workshopId ?? item.workshopTitle ?? "sin-taller";
    const title = item.workshopTitle ?? (item.workshopId ? `Taller ${item.workshopId}` : "Sin taller");
    const existing = groups.get(key);
    const sortKey = item.takenAt ? String(item.takenAt.valueOf()) : "";
    if (!existing) {
      groups.set(key, { key, title, items: [item], sortKey });
    } else {
      existing.items.push(item);
      if (sortKey && sortKey > existing.sortKey) existing.sortKey = sortKey;
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: group.items.slice().sort((a, b) => (b.takenAt?.valueOf() ?? 0) - (a.takenAt?.valueOf() ?? 0)),
    }))
    .sort((a, b) => (b.sortKey ?? "").localeCompare(a.sortKey ?? ""));
}

function includesQuery(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

function RemoteImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      loader={({ src }) => src}
      className="object-cover"
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
    />
  );
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [userId, setUserId] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  const [photos, setPhotos] = React.useState<MemoryPhoto[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let isAlive = true;

    async function run() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user ?? null;

        const nextUserId = user?.id ?? null;
        const nextEmail = user?.email ?? null;

        if (!isAlive) return;
        setUserId(nextUserId);
        setUserEmail(nextEmail);

        if (!nextUserId) {
          setPhotos([]);
          return;
        }

        const rows = await tryFetchMemoryRows({
          supabase,
          tableCandidates: [
            "memories",
            "recuerdos",
            "mis_recuerdos",
            "taller_fotos",
            "workshop_photos",
            "fotos_taller",
            "galeria_talleres",
          ],
          userId: nextUserId,
          userEmail: nextEmail,
        });

        const normalized = rows
          .map(normalizeMemoryPhoto)
          .filter((item): item is MemoryPhoto => Boolean(item));

        if (!isAlive) return;
        setPhotos(normalized);
      } catch (error) {
        if (!isAlive) return;
        const message = error instanceof Error ? error.message : "Error desconocido";
        setLoadError(message);
        setPhotos([]);
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

  const groups = React.useMemo(() => {
    const grouped = groupByWorkshop(photos);
    const trimmed = query.trim();
    if (!trimmed) return grouped;
    return grouped.filter((group) => includesQuery(group.title, trimmed));
  }, [photos, query]);

  return (
    <ApplicationShell09 title="Mis recuerdos" subtitle="Fotos de tus talleres">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Mis recuerdos</h1>
            <p className="text-sm text-muted-foreground">
              Aquí se verán las fotos de los talleres que tomaste, separadas por taller.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Buscar taller..."
              />
            </div>
          </div>
        </div>

        {loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>No se pudo cargar</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => location.reload()}>Reintentar</Button>
            </CardContent>
          </Card>
        ) : null}

        {!userId && !isLoading && !loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>Inicia sesión</CardTitle>
              <CardDescription>
                Para ver tus recuerdos necesitas iniciar sesión.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/entrar">Entrar</a>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx}>
                <CardHeader className="gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, jdx) => (
                      <div key={jdx} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        <Skeleton className="absolute inset-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userId && photos.length ? (
          <div className="grid gap-6">
            {groups.map((group) => (
              <Card key={group.key}>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">{group.title}</CardTitle>
                  <CardDescription>{group.items.length} fotos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {group.items.map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        <RemoteImage
                          src={photo.imageUrl}
                          alt={photo.workshopTitle ?? "Recuerdo"}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userId && !isLoading && !loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin fotos todavía</CardTitle>
              <CardDescription>
                Cuando haya fotos de tus talleres, se van a mostrar aquí por cada taller.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => location.reload()}>
                Reintentar
              </Button>
              {userEmail ? (
                <div className="text-xs text-muted-foreground">Sesión: {userEmail}</div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && userId && photos.length === 0 ? (
          <div className="rounded-2xl border border-foreground/10 p-6">
            <div className="flex items-center gap-3">
              <CameraIcon className="size-5 text-muted-foreground" />
              <div className="text-base font-semibold text-foreground">0 fotos</div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              No se han agregado fotos a tus recuerdos todavía.
            </div>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}
