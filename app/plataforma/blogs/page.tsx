"use client";

import * as React from "react";
import { BookOpenIcon, SearchIcon } from "lucide-react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Input } from "@/plataforma/components/ui/input";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  tags: string[] | null;
};

function formatDateShort(date: Date) {
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [query, setQuery] = React.useState("");
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isAlive = true;

    async function run() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("blog_posts")
          .select("id,slug,title,excerpt,published_at,tags")
          .order("published_at", { ascending: false })
          .limit(200);
        if (error) throw new Error(error.message);
        if (!isAlive) return;
        setPosts(Array.isArray(data) ? (data as unknown as BlogPost[]) : []);
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

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!normalizedQuery) return posts;
    return posts.filter((post) => {
      const haystack = `${post.title} ${post.excerpt ?? ""} ${(post.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, posts]);

  return (
    <ApplicationShell09 title="Nuestro Blog" subtitle="Noticias y contenido de arte">
      <div className="mx-auto w-full max-w-3xl">
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Nuestro Blog
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Noticias, artículos y contenido informativo sobre arte y cultura, curado por Quinta Esencia.
          </p>
        </div>

        <div className="my-10 h-px w-full bg-foreground/10" />
        <div className="grid gap-6">
          <div className="rounded-2xl border border-foreground/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BookOpenIcon className="size-5 text-muted-foreground" />
                <div className="text-base font-semibold text-foreground">Publicaciones</div>
              </div>
              <div className="text-sm text-muted-foreground">{posts.length} publicadas</div>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título, tag o tema..."
                  className="pl-9"
                />
              </div>
              {loadError ? (
                <div className="text-sm text-muted-foreground">{loadError}</div>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-foreground/10 p-6"
                >
                  <div className="h-4 w-40 rounded bg-foreground/10" />
                  <div className="mt-3 h-6 w-2/3 rounded bg-foreground/10" />
                  <div className="mt-3 h-4 w-full rounded bg-foreground/10" />
                </div>
              ))}
            </div>
          ) : filtered.length ? (
            <div className="grid gap-4">
              {filtered.map((post) => {
                const published =
                  post.published_at && !Number.isNaN(new Date(post.published_at).valueOf())
                    ? new Date(post.published_at)
                    : null;
                return (
                  <a
                    key={post.id}
                    href={`/plataforma/blogs/${encodeURIComponent(post.slug)}`}
                    className="group rounded-2xl border border-foreground/10 p-6 transition-colors hover:bg-foreground/[0.02]"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {published ? <span>{formatDateShort(published)}</span> : null}
                      {post.tags?.length ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-foreground/10 bg-foreground/[0.02] px-2 py-0.5 text-xs font-semibold text-foreground/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-tight text-foreground group-hover:underline">
                      {post.title}
                    </div>
                    {post.excerpt ? (
                      <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {post.excerpt}
                      </div>
                    ) : null}
                  </a>
                );
              })}
            </div>
          ) : posts.length ? (
            <div className="rounded-2xl border border-foreground/10 p-6">
              <div className="text-base font-semibold text-foreground">Sin resultados</div>
              <div className="mt-2 text-sm text-muted-foreground">
                No encontramos publicaciones con ese texto.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-foreground/10 p-6">
              <div className="text-base font-semibold text-foreground">Aún no hay publicaciones</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Cuando publiquemos noticias y artículos de arte, van a aparecer aquí.
              </div>
            </div>
          )}
        </div>
      </div>
    </ApplicationShell09>
  );
}

