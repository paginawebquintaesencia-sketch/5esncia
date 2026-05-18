"use client";

import * as React from "react";
import { PaletteIcon, SearchIcon } from "lucide-react";

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

type ArtworkItem = {
  id: string;
  title: string;
  artistName: string;
  imageUrl: string | null;
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

function normalizeArtwork(record: Record<string, unknown>): ArtworkItem {
  const id =
    pickString(record, ["id", "uuid", "obra_id", "artwork_id", "pieza_id"]) ??
    crypto.randomUUID();

  const title =
    pickString(record, ["titulo", "title", "nombre", "name"]) ?? "Obra sin título";

  const artistName =
    pickString(record, ["artista", "artist", "artist_name", "autor", "author"]) ??
    "Artista";

  const imageUrl = pickString(record, [
    "imagen_url",
    "image_url",
    "foto_url",
    "thumbnail_url",
    "cover_url",
  ]);

  return { id, title, artistName, imageUrl, raw: record };
}

async function tryFetchAllArtworks({
  supabase,
  tableCandidates,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
}) {
  for (const table of tableCandidates) {
    const { data, error } = await supabase.from(table).select("*").limit(300);
    if (error) continue;
    if (!Array.isArray(data)) continue;
    return data
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map(normalizeArtwork);
  }
  return [];
}

function includesQuery(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [artworks, setArtworks] = React.useState<ArtworkItem[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let isAlive = true;

    async function run() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const supabase = createClient();
        const items = await tryFetchAllArtworks({
          supabase,
          tableCandidates: ["galeria", "galerias", "obras", "artworks", "piezas", "coleccion"],
        });

        if (!isAlive) return;
        setArtworks(items);
      } catch (error) {
        if (!isAlive) return;
        const message = error instanceof Error ? error.message : "Error desconocido";
        setLoadError(message);
        setArtworks([]);
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

  const filtered = React.useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return artworks;
    return artworks.filter((item) => {
      if (includesQuery(item.title, trimmed)) return true;
      if (includesQuery(item.artistName, trimmed)) return true;
      return false;
    });
  }, [artworks, query]);

  return (
    <ApplicationShell09 title="Galería" subtitle="Obras de arte">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Galería</h1>
            <p className="text-sm text-muted-foreground">
              Explora obras y conoce a sus artistas
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Buscar obra o artista..."
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

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-muted">
                  <Skeleton className="absolute inset-0" />
                </div>
                <CardHeader className="gap-2">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((artwork) => (
              <Card key={artwork.id} className="overflow-hidden">
                {artwork.imageUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-muted-foreground">
                    <PaletteIcon className="size-7" />
                  </div>
                )}

                <CardHeader className="gap-1">
                  <CardTitle className="line-clamp-2 text-base">{artwork.title}</CardTitle>
                  <CardDescription className="truncate">
                    {artwork.artistName}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between gap-2">
                  <Button disabled className="w-full">
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sin obras</CardTitle>
              <CardDescription>
                Aún no se han agregado obras a la galería.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => location.reload()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ApplicationShell09>
  );
}
