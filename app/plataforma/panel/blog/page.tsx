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

type PostRow = {
  id: string;
  slug: string;
  title: string;
  published_at: string | null;
};

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function slugify(input: string) {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "post";
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");

  const [posts, setPosts] = React.useState<PostRow[]>([]);
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
          setPosts([]);
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

        const { data: postRows } = await supabase
          .from("blog_posts")
          .select("id,slug,title,published_at")
          .order("published_at", { ascending: false })
          .limit(200);
        if (!isAlive) return;
        setPosts(Array.isArray(postRows) ? (postRows as unknown as PostRow[]) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setPosts([]);
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
      const { data: postRows } = await supabase
        .from("blog_posts")
        .select("id,slug,title,published_at")
        .order("published_at", { ascending: false })
        .limit(200);
      setPosts(Array.isArray(postRows) ? (postRows as unknown as PostRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
      setPosts([]);
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

    const cleanContent = content.trim();
    if (!cleanContent) {
      setActionMessage("Escribe el contenido.");
      return;
    }

    const baseSlug = slugify(cleanTitle);
    const uniqueSuffix = String(Date.now()).slice(-6);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const tagList = tags
      .split(/[,\n|]/g)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      const { error } = await supabase.from("blog_posts").insert({
        slug,
        title: cleanTitle,
        excerpt: excerpt.trim() || null,
        content: cleanContent,
        tags: tagList,
        published_at: new Date().toISOString(),
        created_by: user?.id ?? null,
      });
      if (error) throw new Error(error.message);

      setTitle("");
      setExcerpt("");
      setContent("");
      setTags("");
      setActionMessage("Entrada publicada.");
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLoadError(message);
    } finally {
      setIsSaving(false);
    }
  }, [content, excerpt, reload, tags, title]);

  return (
    <ApplicationShell09 title="Panel: Blog" subtitle="Administración">
      <div className="grid gap-6">
        {!isLoading && !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>No autorizado</CardTitle>
              <CardDescription>Solo administradores pueden publicar.</CardDescription>
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
                <CardTitle>Nueva entrada</CardTitle>
                <CardDescription>Se mostrará en “Nuestro Blog”.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Título</div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Resumen</div>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Contenido</div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium text-foreground">Tags (opcional)</div>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="arte, pintura, eventos"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onCreate} disabled={isSaving}>
                    {isSaving ? "Publicando..." : "Publicar"}
                  </Button>
                  <Button variant="outline" onClick={reload}>
                    Actualizar lista
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/plataforma/blogs">Ver blog</a>
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
                <CardTitle>Entradas</CardTitle>
                <CardDescription>{posts.length} publicadas</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {posts.length ? (
                  <div className="overflow-hidden rounded-xl border border-foreground/10">
                    <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-6">Título</div>
                      <div className="col-span-3">Fecha</div>
                      <div className="col-span-3">Slug</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {posts.map((post) => (
                        <div key={post.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-6 truncate">{post.title}</div>
                          <div className="col-span-3 truncate text-muted-foreground">
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString("es-MX")
                              : "—"}
                          </div>
                          <div className="col-span-3 truncate font-mono text-xs text-muted-foreground">
                            {post.slug}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay entradas todavía.</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </ApplicationShell09>
  );
}

