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
import { Skeleton } from "@/plataforma/components/ui/skeleton";

type WorkshopItem = {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  raw: Record<string, unknown>;
};

type TabKey = "inscritos" | "guardados";

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNonEmptyString(record[key]);
    if (value) return value;
  }
  return null;
}

function normalizeWorkshop(record: Record<string, unknown>): WorkshopItem {
  const id =
    pickString(record, ["id", "uuid", "taller_id", "workshop_id"]) ??
    crypto.randomUUID();

  const title =
    pickString(record, ["titulo", "title", "nombre", "name"]) ??
    "Taller sin título";

  const description = pickString(record, [
    "descripcion",
    "description",
    "resumen",
    "summary",
  ]);

  const coverUrl = pickString(record, [
    "imagen_url",
    "image_url",
    "cover_url",
    "portada_url",
  ]);

  return { id, title, description, coverUrl, raw: record };
}

async function tryFetchIds({
  supabase,
  tableCandidates,
  userId,
  userColumns,
  workshopIdColumns,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
  userId: string;
  userColumns: string[];
  workshopIdColumns: string[];
}) {
  for (const table of tableCandidates) {
    for (const userCol of userColumns) {
      for (const workshopCol of workshopIdColumns) {
        const { data, error } = await supabase
          .from(table)
          .select(workshopCol)
          .eq(userCol, userId);

        if (error) continue;
        if (!Array.isArray(data)) continue;

        const ids = data
          .map((row) => {
            if (!row || typeof row !== "object") return null;
            const value = (row as Record<string, unknown>)[workshopCol];
            return asNonEmptyString(value);
          })
          .filter((id): id is string => Boolean(id));

        return Array.from(new Set(ids));
      }
    }
  }

  return null;
}

async function tryFetchWorkshops({
  supabase,
  tableCandidates,
  ids,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
  ids: string[];
}) {
  if (!ids.length) return [];

  for (const table of tableCandidates) {
    const { data, error } = await supabase.from(table).select("*").in("id", ids);
    if (error) continue;
    if (!Array.isArray(data)) continue;
    if (!data.length) continue;

    return data
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map(normalizeWorkshop);
  }

  return [];
}

function WorkshopGrid({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: WorkshopItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="line-clamp-2">{item.title}</CardTitle>
            {item.description ? (
              <CardDescription className="line-clamp-3">
                {item.description}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="flex items-center justify-end">
            <Button variant="outline" asChild>
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                }}
              >
                Ver detalles
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = React.useState<TabKey>("inscritos");
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [inscritos, setInscritos] = React.useState<WorkshopItem[]>([]);
  const [guardados, setGuardados] = React.useState<WorkshopItem[]>([]);

  React.useEffect(() => {
    let isAlive = true;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);

      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      const user = data.user ?? null;

      if (!isAlive) return;

      if (error) {
        setLoadError("No se pudo obtener tu sesión.");
        setIsLoading(false);
        return;
      }

      if (!user) {
        setUserEmail(null);
        setIsLoading(false);
        return;
      }

      setUserEmail(user.email ?? null);

      const enrolledIds =
        (await tryFetchIds({
          supabase,
          tableCandidates: [
            "taller_inscripciones",
            "talleres_inscripciones",
            "inscripciones_talleres",
          ],
          userId: user.id,
          userColumns: ["user_id", "usuario_id"],
          workshopIdColumns: ["taller_id", "workshop_id"],
        })) ?? [];

      const savedIds =
        (await tryFetchIds({
          supabase,
          tableCandidates: ["taller_guardados", "talleres_guardados", "taller_favoritos"],
          userId: user.id,
          userColumns: ["user_id", "usuario_id"],
          workshopIdColumns: ["taller_id", "workshop_id"],
        })) ?? [];

      const [enrolledWorkshops, savedWorkshops] = await Promise.all([
        tryFetchWorkshops({
          supabase,
          tableCandidates: ["talleres", "workshops", "events", "eventos"],
          ids: enrolledIds,
        }),
        tryFetchWorkshops({
          supabase,
          tableCandidates: ["talleres", "workshops", "events", "eventos"],
          ids: savedIds,
        }),
      ]);

      if (!isAlive) return;

      setInscritos(enrolledWorkshops);
      setGuardados(savedWorkshops);
      setIsLoading(false);
    };

    run();
    return () => {
      isAlive = false;
    };
  }, []);

  return (
    <ApplicationShell09 title="Mis talleres" subtitle="Inscritos y guardados">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Talleres</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={tab === "inscritos" ? "default" : "outline"}
              onClick={() => setTab("inscritos")}
            >
              Inscritos ({inscritos.length})
            </Button>
            <Button
              variant={tab === "guardados" ? "default" : "outline"}
              onClick={() => setTab("guardados")}
            >
              Guardados ({guardados.length})
            </Button>
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

        {!userEmail && !isLoading && !loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>Inicia sesión</CardTitle>
              <CardDescription>
                Para ver tus talleres inscritos o guardados, primero debes entrar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/entrar">Ir a entrar</a>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex items-center justify-end">
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex items-center justify-end">
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
            <Card className="hidden lg:flex lg:flex-col">
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-end">
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
            <Card className="hidden lg:flex lg:flex-col">
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-end">
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          </div>
        ) : userEmail ? (
          <WorkshopGrid
            items={tab === "inscritos" ? inscritos : guardados}
            emptyTitle={
              tab === "inscritos"
                ? "Aún no estás inscrito en talleres"
                : "Aún no tienes talleres guardados"
            }
            emptyDescription={
              tab === "inscritos"
                ? "Cuando te inscribas, aparecerán aquí."
                : "Cuando guardes un taller, aparecerá aquí."
            }
          />
        ) : null}
      </div>
    </ApplicationShell09>
  );
}
