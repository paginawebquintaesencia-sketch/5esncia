"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Button } from "@/plataforma/components/ui/button";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  published_at: string | null;
  tags: string[] | null;
};

function formatDateLong(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? "";
  const [isLoading, setIsLoading] = React.useState(true);
  const [post, setPost] = React.useState<BlogPost | null>(null);
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
          .select("id,slug,title,excerpt,content,published_at,tags")
          .eq("slug", slug)
          .limit(1);
        if (error) throw new Error(error.message);
        const row = Array.isArray(data) && data[0] ? (data[0] as unknown as BlogPost) : null;
        if (!isAlive) return;
        setPost(row);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        if (!isAlive) return;
        setLoadError(message);
        setPost(null);
      } finally {
        if (!isAlive) return;
        setIsLoading(false);
      }
    }

    if (slug) run();
    else {
      setIsLoading(false);
      setPost(null);
    }

    return () => {
      isAlive = false;
    };
  }, [slug]);

  const published =
    post?.published_at && !Number.isNaN(new Date(post.published_at).valueOf())
      ? new Date(post.published_at)
      : null;

  return (
    <ApplicationShell09 title="Nuestro Blog" subtitle="Noticias y contenido de arte">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/plataforma/blogs">
              <ArrowLeftIcon className="mr-2 size-4" />
              Volver
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-foreground/10 p-6">
            <div className="h-6 w-2/3 rounded bg-foreground/10" />
            <div className="mt-3 h-4 w-40 rounded bg-foreground/10" />
            <div className="mt-6 h-4 w-full rounded bg-foreground/10" />
            <div className="mt-2 h-4 w-5/6 rounded bg-foreground/10" />
            <div className="mt-2 h-4 w-2/3 rounded bg-foreground/10" />
          </div>
        ) : post ? (
          <div className="rounded-2xl border border-foreground/10 p-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {published ? <span className="capitalize">{formatDateLong(published)}</span> : null}
              {post.tags?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {post.tags.slice(0, 6).map((tag) => (
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

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-3 text-base text-muted-foreground">{post.excerpt}</p>
            ) : null}

            {post.content ? (
              <div className="prose prose-neutral mt-6 max-w-none">
                {post.content.split("\n").map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-foreground/10 p-6">
            <div className="text-base font-semibold text-foreground">Sin publicación</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Todavía no se ha publicado esta nota.
            </div>
            {loadError ? (
              <div className="mt-3 text-sm text-muted-foreground">{loadError}</div>
            ) : null}
          </div>
        )}
      </div>
    </ApplicationShell09>
  );
}
