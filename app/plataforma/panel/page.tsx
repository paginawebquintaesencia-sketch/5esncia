"use client";

import * as React from "react";
import {
  CalendarDaysIcon,
  GalleryHorizontalEndIcon,
  NotebookTextIcon,
  ScrollTextIcon,
  UsersIcon,
  GraduationCapIcon,
} from "lucide-react";

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

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

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
        setRole(normalizeRole(user?.user_metadata?.role) ?? null);

        if (!user) {
          setRoleFromDb(null);
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
        setRoleFromDb(normalizeRole(rawRole) ?? null);
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

  const roleCandidate = roleFromDb ?? role;
  const isAdmin =
    isAdminEmail ||
    roleCandidate === "admin" ||
    roleCandidate === "administrador" ||
    roleCandidate === "superadmin";

  return (
    <ApplicationShell09 title="Panel de control" subtitle="Administración de contenido">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>
                Esta sección es solo para administradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="/plataforma">Volver</a>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GalleryHorizontalEndIcon className="size-4" />
                  Galería
                </CardTitle>
                <CardDescription>Agregar pinturas y obras</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href="/plataforma/panel/galeria">Administrar</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDaysIcon className="size-4" />
                  Eventos
                </CardTitle>
                <CardDescription>Agregar eventos al calendario</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href="/plataforma/panel/eventos">Administrar</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollTextIcon className="size-4" />
                  Blog
                </CardTitle>
                <CardDescription>Publicar noticias y artículos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href="/plataforma/panel/blog">Administrar</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="size-4" />
                  Artistas
                </CardTitle>
                <CardDescription>Agregar perfiles de artistas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href="/plataforma/panel/artistas">Administrar</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NotebookTextIcon className="size-4" />
                  Recuerdos
                </CardTitle>
                <CardDescription>Subir fotos por taller y usuario</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href="/plataforma/panel/recuerdos">Administrar</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCapIcon className="size-4" />
                  Talleres
                </CardTitle>
                <CardDescription>Agregar y editar talleres</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href="/plataforma/panel/talleres">Administrar</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}
