"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  AtSignIcon,
  ExternalLinkIcon,
  GalleryHorizontalEndIcon,
  GlobeIcon,
  GraduationCapIcon,
  HomeIcon,
  LayoutDashboard,
  LogOutIcon,
  MailIcon,
  NotebookTextIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { createClient } from "@/lib/client";
import { Button } from "@/plataforma/components/ui/button";
import { Card, CardContent } from "@/plataforma/components/ui/card";
import { Input } from "@/plataforma/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/plataforma/components/ui/sidebar";
import SignOutMenuItem from "./sign-out-menu-item";

export default function ApplicationShell09({
  title = "Plataforma",
  subtitle = "Quinta Esencia",
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const [user, setUser] = React.useState<{
    email: string | null;
    user_metadata?: Record<string, unknown>;
  } | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const nextUser = data.user;
      setUser(
        data.user
          ? {
              email: data.user.email ?? null,
              user_metadata: data.user.user_metadata ?? undefined,
            }
          : null,
      );

      if (!nextUser) {
        setRoleFromDb(null);
        return;
      }

      supabase
        .from("profiles")
        .select("role")
        .eq("id", nextUser.id)
        .limit(1)
        .then(({ data }) => {
          const rawRole = Array.isArray(data) && data[0] ? (data[0] as { role?: unknown }).role : null;
          setRoleFromDb(typeof rawRole === "string" ? rawRole : null);
        });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(
        nextUser
          ? {
              email: nextUser.email ?? null,
              user_metadata: nextUser.user_metadata ?? undefined,
            }
          : null,
      );

      if (!nextUser) {
        setRoleFromDb(null);
        return;
      }

      supabase
        .from("profiles")
        .select("role")
        .eq("id", nextUser.id)
        .limit(1)
        .then(({ data }) => {
          const rawRole = Array.isArray(data) && data[0] ? (data[0] as { role?: unknown }).role : null;
          setRoleFromDb(typeof rawRole === "string" ? rawRole : null);
        });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const rawName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name) ||
    null;

  const displayName = rawName || (user?.email ? user.email.split("@")[0] : null);
  const displayEmail = user?.email ?? null;

  const roleFromMetadata =
    typeof user?.user_metadata?.role === "string" ? user.user_metadata.role : null;

  const roleCandidate = roleFromDb ?? roleFromMetadata;

  const isAdminEmail = React.useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    if (!raw || !displayEmail) return false;
    const list = raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(displayEmail.toLowerCase());
  }, [displayEmail]);

  const isAdmin =
    isAdminEmail ||
    roleCandidate?.toLowerCase() === "admin" ||
    roleCandidate?.toLowerCase() === "administrador" ||
    roleCandidate?.toLowerCase() === "superadmin" ||
    user?.user_metadata?.is_admin === true;

  const roleLabel = isAdmin ? "Administrador" : "Usuario";
  const initials = (displayName || "Usuario")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");

  const pathname = usePathname();
  const isActiveHref = React.useCallback(
    (href: string) => {
      if (!pathname) return false;
      if (href === "/plataforma") return pathname === href;
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const platformItems = React.useMemo(
    () => [
      { href: "/plataforma", label: "Dashboard", icon: HomeIcon },
      { href: "/plataforma/talleres", label: "Mis talleres", icon: GraduationCapIcon },
      { href: "/plataforma/recuerdos", label: "Mis Recuerdos", icon: NotebookTextIcon },
      { href: "/plataforma/galeria", label: "Galeria", icon: GalleryHorizontalEndIcon },
      { href: "/plataforma/eventos", label: "Eventos", icon: CalendarDaysIcon },
      { href: "/plataforma/artistas", label: "Artistas", icon: UsersIcon },
      { href: "/plataforma/blogs", label: "Blogs", icon: ScrollTextIcon },
      { href: "/plataforma/suscripcion", label: "Susbscripcion", icon: CreditCardIcon },
    ],
    [],
  );

  const supportItems = React.useMemo(
    () => [
      ...(isAdmin
        ? [
            { href: "/plataforma/usuarios", label: "Usuarios", icon: UsersIcon },
            { href: "/plataforma/panel", label: "Panel de control", icon: LayoutDashboard },
          ]
        : []),
    ],
    [isAdmin],
  );

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <div className="mx-2 mt-2 rounded-2xl border border-white/15 bg-[#FC5E33] px-4 py-5 text-white/90">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/10 text-sm font-semibold">
                  {initials}
                </div>
                <div className="grid gap-0.5">
                  <p className="text-sm font-semibold">
                    {displayName ?? "Usuario"}
                  </p>
                  <p className="text-xs text-white/80">{displayEmail ?? "—"}</p>
                  <p className="text-[11px] font-semibold text-white/80">
                    {roleLabel}
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-1 text-white/75">
                  <a
                    href="#"
                    aria-label="Sitio"
                    className="transition-colors hover:text-white"
                  >
                    <GlobeIcon className="size-4" />
                  </a>
                  <a
                    href="#"
                    aria-label="Email"
                    className="transition-colors hover:text-white"
                  >
                    <MailIcon className="size-4" />
                  </a>
                  <a
                    href="#"
                    aria-label="Usuario"
                    className="transition-colors hover:text-white"
                  >
                    <AtSignIcon className="size-4" />
                  </a>
                  <a
                    href="#"
                    aria-label="Enlace"
                    className="transition-colors hover:text-white"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </div>
              </div>
            </div>

            <SidebarGroup className="[&_[data-sidebar=menu-button]]:!text-[#222C47]/80 [&_[data-sidebar=menu-button]]:hover:!text-[#222C47]/90 [&_[data-sidebar=menu-button][data-active=true]]:!text-[#222C47]/95 [&_[data-sidebar=menu-button]_svg]:!text-[#222C47]/80">
              <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActiveHref(item.href)}>
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarSeparator className="mx-4" />
            <SidebarGroup className="w-full overflow-hidden rounded-2xl border border-white/15 bg-[#DD43A8] text-white/90 [&_[data-sidebar=group-label]]:!text-white/85 [&_[data-sidebar=menu-button]]:!text-white/95 [&_[data-sidebar=menu-button]]:hover:!text-white [&_[data-sidebar=menu-button]]:hover:bg-white/12 [&_[data-sidebar=menu-button][data-active=true]]:!text-white [&_[data-sidebar=menu-button][data-active=true]]:bg-white/18 [&_[data-sidebar=menu-button]_svg]:!text-white/95">
              <SidebarGroupLabel>Soporte</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {supportItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActiveHref(item.href)}>
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SignOutMenuItem icon={<LogOutIcon />} label="Cerrar sesión" />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-card sticky top-0 z-50 flex items-center gap-3 border-b px-4 py-3 sm:px-6">
            <SidebarTrigger className="[&_svg]:!size-5" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            </div>

            <div className="hidden max-w-xs flex-1 items-center gap-2 sm:flex">
              <div className="relative w-full">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar..." />
              </div>
            </div>

            <Button variant="outline" size="icon" aria-label="Notificaciones">
              <BellIcon />
            </Button>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            {children ? (
              children
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardContent className="h-[420px]">
                    <div className="border-card-foreground/10 h-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)]" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="h-[420px]">
                    <div className="border-card-foreground/10 h-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)]" />
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
