"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLinkIcon, RouteIcon } from "lucide-react";

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

type ArtistItem = {
  id: string;
  name: string;
  role?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  tags: string[];
  links: {
    website?: string | null;
    instagram?: string | null;
    youtube?: string | null;
  };
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

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asNonEmptyString(item))
      .filter((item): item is string => Boolean(item))
      .map((item) => item.toLowerCase());
  }

  const asString = asNonEmptyString(value);
  if (!asString) return [];

  return asString
    .split(/[,\n|]/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.toLowerCase());
}

function normalizeUrl(value: unknown) {
  const asString = asNonEmptyString(value);
  if (!asString) return null;

  try {
    const url = new URL(asString, "https://example.com");
    if (!url.protocol || url.protocol === "https:" || url.protocol === "http:") {
      return asString;
    }
  } catch {
    return asString;
  }

  return asString;
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function normalizeArtist(record: Record<string, unknown>): ArtistItem {
  const id =
    pickString(record, ["id", "uuid", "artist_id", "artista_id", "perfil_id"]) ??
    crypto.randomUUID();

  const name =
    pickString(record, ["nombre_artistico", "nombre", "name", "display_name", "full_name"]) ??
    "Artista sin nombre";

  const role = pickString(record, [
    "rol",
    "role",
    "disciplina",
    "especialidad",
    "specialty",
    "area",
  ]);

  const bio = pickString(record, ["bio", "biografia", "descripcion", "description", "resumen"]);

  const avatarUrl = pickString(record, [
    "avatar_url",
    "foto_url",
    "photo_url",
    "imagen_url",
    "image_url",
  ]);

  const tags = Array.from(
    new Set(
      [
        ...normalizeTags(record.tags),
        ...normalizeTags(record.disciplinas),
        ...normalizeTags(record.categorias),
        ...normalizeTags(record.categories),
        ...normalizeTags(record.etiquetas),
      ].filter(Boolean),
    ),
  );

  const website = normalizeUrl(
    pickString(record, ["website", "web", "sitio_web", "url", "pagina_web"]),
  );
  const instagram = normalizeUrl(pickString(record, ["instagram", "instagram_url", "ig"]));
  const youtube = normalizeUrl(pickString(record, ["youtube", "youtube_url", "yt"]));

  return {
    id,
    name,
    role,
    bio,
    avatarUrl,
    tags,
    links: { website, instagram, youtube },
    raw: record,
  };
}

async function tryFetchArtists({
  supabase,
  tableCandidates,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
}) {
  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(250);

    if (error) continue;
    if (!Array.isArray(data)) continue;

    return data
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map(normalizeArtist);
  }

  return null;
}

function ArtistCard({ artist }: { artist: ArtistItem }) {
  const initials = initialsFromName(artist.name);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          {artist.avatarUrl ? (
            <Image
              alt={artist.name}
              src={artist.avatarUrl}
              width={48}
              height={48}
              sizes="48px"
              unoptimized
              className="size-12 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-foreground/10">
              {initials || "AE"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{artist.name}</CardTitle>
            {artist.role ? (
              <CardDescription className="line-clamp-1">
                {artist.role}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {artist.bio ? (
          <p className="line-clamp-4 text-sm text-muted-foreground">{artist.bio}</p>
        ) : null}

        {artist.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {artist.tags.slice(0, 6).map((tag) => (
              <span
                key={`${artist.id}-${tag}`}
                className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground ring-1 ring-foreground/10"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {artist.links.instagram ? (
            <Button variant="outline" size="sm" asChild>
              <a href={artist.links.instagram} target="_blank" rel="noreferrer">
                <RouteIcon className="mr-2 size-4" />
                Instagram
              </a>
            </Button>
          ) : null}
          {artist.links.youtube ? (
            <Button variant="outline" size="sm" asChild>
              <a href={artist.links.youtube} target="_blank" rel="noreferrer">
                <RouteIcon className="mr-2 size-4" />
                YouTube
              </a>
            </Button>
          ) : null}
          {artist.links.website ? (
            <Button variant="outline" size="sm" asChild>
              <a href={artist.links.website} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="mr-2 size-4" />
                Sitio
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ArtistGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [artists, setArtists] = React.useState<ArtistItem[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let isAlive = true;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);

      const supabase = createClient();

      try {
        const items =
          (await tryFetchArtists({
            supabase,
            tableCandidates: [
              "artistas",
              "artists",
              "familia_artistas",
              "quintaesencia_artistas",
              "quinta_esencia_artistas",
              "profiles",
            ],
          })) ?? [];

        if (!isAlive) return;
        setArtists(items);
      } catch (error) {
        if (!isAlive) return;
        setLoadError(
          error instanceof Error ? error.message : "No se pudo cargar el catálogo.",
        );
      } finally {
        if (!isAlive) return;
        setIsLoading(false);
      }
    };

    run();

    return () => {
      isAlive = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return artists;

    return artists.filter((artist) => {
      const haystack = [
        artist.name,
        artist.role ?? "",
        artist.bio ?? "",
        artist.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [artists, query]);

  return (
    <ApplicationShell09 title="Artistas" subtitle="Catálogo · Quinta Esencia">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Familia Quinta Esencia</CardTitle>
            <CardDescription>
              Explora el catálogo de artistas. Usa el buscador para filtrar por nombre,
              disciplina o etiquetas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar artista..."
              />
              <Button
                variant="outline"
                onClick={() => setQuery("")}
                disabled={!query.trim()}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>No se pudo cargar</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {isLoading ? (
          <ArtistGridSkeleton />
        ) : filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sin artistas para mostrar</CardTitle>
              <CardDescription>
                No hay resultados con el filtro actual o no se encontraron registros en
                la base de datos.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </ApplicationShell09>
  );
}
