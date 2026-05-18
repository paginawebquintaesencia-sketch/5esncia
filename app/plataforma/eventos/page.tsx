"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  instructor?: string | null;
  workshopType?: string | null;
  cost?: string | null;
  includes?: string | null;
  whatToDo?: string | null;
  dateKey: string | null;
  startsAt: Date | null;
  timeText?: string | null;
  location?: string | null;
  raw: Record<string, unknown>;
};

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

function pickNumberish(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    const asString = asNonEmptyString(value);
    if (asString) return asString;
  }
  return null;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return date;
  }
  const asString = asNonEmptyString(value);
  if (asString) {
    const date = new Date(asString);
    if (!Number.isNaN(date.valueOf())) return date;
  }
  return null;
}

function toDateKey(date: Date) {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeEvent(record: Record<string, unknown>): EventItem {
  const id =
    pickString(record, ["id", "uuid", "taller_id", "workshop_id", "evento_id"]) ??
    crypto.randomUUID();

  const title =
    pickString(record, ["titulo", "title", "nombre", "name"]) ?? "Evento sin título";

  const description = pickString(record, [
    "descripcion",
    "description",
    "resumen",
    "summary",
  ]);

  const instructor = pickString(record, [
    "quien_lo_da",
    "instructor",
    "ponente",
    "facilitador",
    "profesor",
    "teacher",
  ]);

  const workshopType = pickString(record, [
    "tipo_taller",
    "tipo",
    "category",
    "categoria",
  ]);

  const cost = pickNumberish(record, ["costo", "precio", "price", "cost", "tarifa"]);

  const includes = pickString(record, ["incluye", "includes", "incluido", "kit"]);

  const whatToDo = pickString(record, [
    "que_se_hara",
    "que_haremos",
    "contenido",
    "temario",
    "agenda",
  ]);

  const location = pickString(record, [
    "lugar",
    "ubicacion",
    "location",
    "direccion",
    "address",
  ]);

  const timeText = pickString(record, ["hora", "time", "hora_inicio", "start_time"]);

  const startsAt =
    parseDate(
      record["fecha"] ??
        record["date"] ??
        record["starts_at"] ??
        record["startsAt"] ??
        record["fecha_inicio"] ??
        record["start_date"] ??
        record["start_at"] ??
        record["inicio"],
    ) ?? null;

  const dateKey = startsAt ? toDateKey(startsAt) : null;

  return {
    id,
    title,
    description,
    instructor,
    workshopType,
    cost,
    includes,
    whatToDo,
    dateKey,
    startsAt,
    timeText,
    location,
    raw: record,
  };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getMondayBasedDayIndex(date: Date) {
  const day = date.getDay();
  return (day + 6) % 7;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(
    date,
  );
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

async function tryFetchAllEvents({
  supabase,
  tableCandidates,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
}) {
  for (const table of tableCandidates) {
    const { data, error } = await supabase.from(table).select("*").limit(500);
    if (error) continue;
    if (!Array.isArray(data)) continue;
    return data
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map(normalizeEvent)
      .filter((item) => item.dateKey);
  }
  return [];
}

async function tryEnroll({
  supabase,
  tableCandidates,
  userId,
  eventId,
}: {
  supabase: ReturnType<typeof createClient>;
  tableCandidates: string[];
  userId: string;
  eventId: string;
}) {
  const userColumns = ["user_id", "usuario_id"];
  const workshopColumns = ["taller_id", "workshop_id"];

  for (const table of tableCandidates) {
    for (const userCol of userColumns) {
      for (const workshopCol of workshopColumns) {
        const { error } = await supabase
          .from(table)
          .insert({ [userCol]: userId, [workshopCol]: eventId } as Record<
            string,
            string
          >);

        if (!error) return { ok: true as const };

        const anyError = error as { code?: string; message?: string } | null;
        if (anyError?.code === "23505") {
          return { ok: true as const, already: true as const };
        }
      }
    }
  }

  return { ok: false as const };
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [cursorMonth, setCursorMonth] = React.useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = React.useState(() =>
    toDateKey(new Date()),
  );
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = React.useState(false);

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

      setUserId(user?.id ?? null);

      const items = await tryFetchAllEvents({
        supabase,
        tableCandidates: ["events", "eventos", "talleres", "workshops"],
      });

      if (!isAlive) return;

      setEvents(items);
      setIsLoading(false);
    };

    run();
    return () => {
      isAlive = false;
    };
  }, []);

  const eventsByDateKey = React.useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const item of events) {
      if (!item.dateKey) continue;
      const list = map.get(item.dateKey) ?? [];
      list.push(item);
      map.set(item.dateKey, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const aTime = a.startsAt?.valueOf() ?? 0;
        const bTime = b.startsAt?.valueOf() ?? 0;
        return aTime - bTime;
      });
    }
    return map;
  }, [events]);

  const monthDays = React.useMemo(() => {
    const first = startOfMonth(cursorMonth);
    const startIndex = getMondayBasedDayIndex(first);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

    const cells: Array<{ date: Date; inMonth: boolean; dateKey: string }> = [];

    for (let i = 0; i < startIndex; i++) {
      const date = new Date(first.getFullYear(), first.getMonth(), 1 - (startIndex - i));
      cells.push({ date, inMonth: false, dateKey: toDateKey(date) });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(first.getFullYear(), first.getMonth(), day);
      cells.push({ date, inMonth: true, dateKey: toDateKey(date) });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1]?.date ?? first;
      const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date, inMonth: false, dateKey: toDateKey(date) });
    }

    return cells;
  }, [cursorMonth]);

  const selectedEvents = React.useMemo(() => {
    return eventsByDateKey.get(selectedDateKey) ?? [];
  }, [eventsByDateKey, selectedDateKey]);

  const resolvedSelectedEventId = React.useMemo(() => {
    const list = eventsByDateKey.get(selectedDateKey) ?? [];
    if (selectedEventId && list.some((event) => event.id === selectedEventId)) {
      return selectedEventId;
    }
    return list[0]?.id ?? null;
  }, [eventsByDateKey, selectedDateKey, selectedEventId]);

  const selectedEvent = React.useMemo(() => {
    if (!resolvedSelectedEventId) return null;
    const list = eventsByDateKey.get(selectedDateKey) ?? [];
    return (
      list.find((item) => item.id === resolvedSelectedEventId) ??
      events.find((item) => item.id === resolvedSelectedEventId) ??
      null
    );
  }, [eventsByDateKey, events, resolvedSelectedEventId, selectedDateKey]);

  const onPickDay = React.useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSelectedEventId(null);
    setActionMessage(null);
  }, []);

  const onPickEvent = React.useCallback((id: string) => {
    setSelectedEventId(id);
    setActionMessage(null);
  }, []);

  const onEnroll = React.useCallback(async () => {
    if (!selectedEvent) return;
    if (!userId) {
      location.href = "/entrar";
      return;
    }

    setIsEnrolling(true);
    setActionMessage(null);
    try {
      const supabase = createClient();
      const result = await tryEnroll({
        supabase,
        tableCandidates: [
          "taller_inscripciones",
          "talleres_inscripciones",
          "inscripciones_talleres",
        ],
        userId,
        eventId: selectedEvent.id,
      });

      if (result.ok) {
        setActionMessage(
          result.already
            ? "Ya estabas inscrito en este taller."
            : "Listo, ya quedaste inscrito.",
        );
      } else {
        setActionMessage("No se pudo inscribir. Intenta de nuevo.");
      }
    } finally {
      setIsEnrolling(false);
    }
  }, [selectedEvent, userId]);

  const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <ApplicationShell09
      title="Eventos"
      subtitle="Calendario de talleres e inscripción"
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes anterior"
              onClick={() => setCursorMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <div className="min-w-48 text-center text-sm font-medium capitalize text-foreground">
              {formatMonthLabel(cursorMonth)}
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes siguiente"
              onClick={() => setCursorMonth((current) => addMonths(current, 1))}
            >
              <ChevronRightIcon />
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

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground">
                {weekdayLabels.map((label) => (
                  <div key={label} className="px-1 py-1 text-center">
                    {label}
                  </div>
                ))}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 42 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="min-h-[105px] rounded-xl border border-foreground/10 p-2.5"
                    >
                      <Skeleton className="h-4 w-10" />
                      <div className="mt-2.5 grid gap-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((cell) => {
                    const list = eventsByDateKey.get(cell.dateKey) ?? [];
                    const isSelected = selectedDateKey === cell.dateKey;
                    const isToday = cell.dateKey === toDateKey(new Date());
                    return (
                      <div
                        key={cell.dateKey}
                        role="button"
                        tabIndex={0}
                        onClick={() => onPickDay(cell.dateKey)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onPickDay(cell.dateKey);
                          }
                        }}
                        className={[
                          "group min-h-[105px] rounded-xl border p-2.5 text-left outline-hidden transition-colors md:min-h-[120px]",
                          isSelected
                            ? "border-foreground/30 bg-muted/60 ring-2 ring-foreground/10"
                            : "border-foreground/10 hover:bg-muted/40",
                          cell.inMonth ? "bg-background" : "bg-muted/30",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={[
                              "text-sm font-semibold",
                              cell.inMonth
                                ? "text-foreground"
                                : "text-muted-foreground",
                            ].join(" ")}
                          >
                            {cell.date.getDate()}
                          </span>
                          <div className="flex items-center gap-2">
                            {list.length ? (
                              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
                                {list.length}
                              </span>
                            ) : null}
                            {isToday ? (
                              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
                                Hoy
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {list.length ? (
                          <div className="mt-2.5 grid gap-2">
                            {list.slice(0, 3).map((event) => (
                              <button
                                key={event.id}
                                type="button"
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  onPickDay(cell.dateKey);
                                  onPickEvent(event.id);
                                }}
                                className={[
                                  "truncate rounded-md px-2 py-1 text-xs outline-hidden transition-colors",
                                  resolvedSelectedEventId === event.id
                                    ? "bg-foreground/10 text-foreground"
                                    : "bg-muted/60 text-foreground/80 hover:bg-muted",
                                ].join(" ")}
                              >
                                {event.title}
                              </button>
                            ))}
                            {list.length > 3 ? (
                              <div className="text-xs text-muted-foreground">
                                +{list.length - 3} más
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-2.5 text-xs text-muted-foreground">
                            Sin eventos
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalle</CardTitle>
                <CardDescription>
                  {selectedEvent?.startsAt
                    ? formatDateLong(selectedEvent.startsAt)
                    : "Selecciona un evento para ver la información."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {isLoading ? (
                  <div className="grid gap-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                ) : selectedEvent ? (
                  <div className="grid gap-3 text-sm">
                    <div className="grid gap-1">
                      <div className="text-xs text-muted-foreground">Nombre</div>
                      <div className="font-medium text-foreground">
                        {selectedEvent.title}
                      </div>
                    </div>

                    {selectedEvent.instructor ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">
                          Quién lo da
                        </div>
                        <div className="text-foreground">
                          {selectedEvent.instructor}
                        </div>
                      </div>
                    ) : null}

                    {selectedEvent.workshopType ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">
                          Tipo de taller
                        </div>
                        <div className="text-foreground">
                          {selectedEvent.workshopType}
                        </div>
                      </div>
                    ) : null}

                    {selectedEvent.cost ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">Costo</div>
                        <div className="text-foreground">{selectedEvent.cost}</div>
                      </div>
                    ) : null}

                    {selectedEvent.includes ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">
                          Qué incluye
                        </div>
                        <div className="text-foreground">{selectedEvent.includes}</div>
                      </div>
                    ) : null}

                    {selectedEvent.whatToDo ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">
                          Qué se hará
                        </div>
                        <div className="text-foreground">{selectedEvent.whatToDo}</div>
                      </div>
                    ) : null}

                    {selectedEvent.dateKey ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">Fecha</div>
                        <div className="text-foreground">{selectedEvent.dateKey}</div>
                      </div>
                    ) : null}

                    {selectedEvent.location ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">Lugar</div>
                        <div className="text-foreground">{selectedEvent.location}</div>
                      </div>
                    ) : null}

                    {selectedEvent.timeText ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">Hora</div>
                        <div className="text-foreground">{selectedEvent.timeText}</div>
                      </div>
                    ) : null}

                    {selectedEvent.description ? (
                      <div className="grid gap-1">
                        <div className="text-xs text-muted-foreground">
                          Descripción
                        </div>
                        <div className="text-foreground">{selectedEvent.description}</div>
                      </div>
                    ) : null}

                    <div className="grid gap-2">
                      <Button onClick={onEnroll} disabled={isEnrolling}>
                        {userId ? "Inscribirme" : "Inicia sesión para inscribirte"}
                      </Button>
                      {actionMessage ? (
                        <div className="text-xs text-muted-foreground">
                          {actionMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Selecciona un evento para ver la información y poder inscribirte.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos talleres</CardTitle>
                <CardDescription>
                  {selectedDateKey ? selectedDateKey : "Selecciona un día"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {isLoading ? (
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    <div className="grid gap-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      {selectedEvents.length ? (
                        selectedEvents.map((event) => (
                          <Button
                            key={event.id}
                            variant={
                              resolvedSelectedEventId === event.id
                                ? "default"
                                : "outline"
                            }
                            className="justify-start"
                            onClick={() => onPickEvent(event.id)}
                          >
                            {event.timeText ? `${event.timeText} · ` : ""}
                            {event.title}
                          </Button>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No hay talleres para este día.
                        </div>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        Descripción del taller
                      </div>
                      {selectedEvent?.description ? (
                        <div className="text-sm text-foreground">
                          {selectedEvent.description}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Selecciona un taller para ver su descripción.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ApplicationShell09>
  );
}
