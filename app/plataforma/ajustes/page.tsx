"use client";

import * as React from "react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Button } from "@/plataforma/components/ui/button";
import { Input } from "@/plataforma/components/ui/input";
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

function roleLabel(isAdmin: boolean) {
  return isAdmin ? "Administrador" : "Usuario";
}

type ProfileRow = {
  id: string;
  email?: string | null;
  role?: string | null;
  full_name?: string | null;
  nickname?: string | null;
  art_type?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [roleFromDb, setRoleFromDb] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [artType, setArtType] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [facebook, setFacebook] = React.useState("");

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
        setUserId(user?.id ?? null);
        setRole(normalizeRole(user?.user_metadata?.role) ?? null);

        if (!user) {
          setRoleFromDb(null);
          setProfile(null);
          return;
        }

        const { data: profileRows } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .limit(1);
        const row =
          Array.isArray(profileRows) && profileRows[0]
            ? (profileRows[0] as unknown as ProfileRow)
            : null;
        const rawRole = row?.role ?? null;
        if (!isAlive) return;
        setRoleFromDb(normalizeRole(rawRole) ?? null);
        setProfile(row);

        setFullName(row?.full_name ?? user.user_metadata?.full_name ?? "");
        setNickname(row?.nickname ?? "");
        setArtType(row?.art_type ?? "");
        setAvatarUrl(row?.avatar_url ?? "");
        setPhone(row?.phone ?? "");
        setInstagram(row?.instagram ?? "");
        setFacebook(row?.facebook ?? "");
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

  const onSaveProfile = React.useCallback(async () => {
    if (!userId) {
      setSaveError("Inicia sesión para guardar tu perfil.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          nickname: nickname.trim() || null,
          art_type: artType.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          phone: phone.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
        })
        .eq("id", userId);

      if (error) throw new Error(error.message);

      setSaveSuccess("Perfil actualizado.");
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .limit(1);
      const nextRow =
        Array.isArray(profileRows) && profileRows[0]
          ? (profileRows[0] as unknown as ProfileRow)
          : null;
      setProfile(nextRow);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    artType,
    avatarUrl,
    facebook,
    fullName,
    instagram,
    nickname,
    phone,
    userId,
  ]);

  return (
    <ApplicationShell09 title="Ajustes" subtitle="Configuración">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>Datos básicos de tu sesión</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{email ?? (isLoading ? "Cargando..." : "—")}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-medium">{roleLabel(isAdmin)}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{userId ?? (isLoading ? "…" : "—")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Configura tu información pública y de contacto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {!userId && !isLoading ? (
              <div className="text-sm text-muted-foreground">
                Inicia sesión para editar tu perfil.
              </div>
            ) : (
              <>
                {avatarUrl.trim() ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarUrl.trim()}
                      alt="Avatar"
                      className="h-14 w-14 rounded-full object-cover ring-1 ring-foreground/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-sm text-muted-foreground">
                      Vista previa del avatar
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Nombre</div>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Usuario (nickname)</div>
                    <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Tipo de arte</div>
                    <Input value={artType} onChange={(e) => setArtType(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Celular</div>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Avatar (URL)</div>
                    <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Instagram</div>
                    <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium text-foreground">Facebook</div>
                    <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={onSaveProfile} disabled={isSaving || isLoading || !userId}>
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  {profile?.id ? (
                    <div className="text-xs text-muted-foreground">
                      Perfil: {profile.id}
                    </div>
                  ) : null}
                </div>

                {saveError ? (
                  <div className="text-sm text-muted-foreground">{saveError}</div>
                ) : null}
                {saveSuccess ? (
                  <div className="text-sm text-muted-foreground">{saveSuccess}</div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Administración</CardTitle>
              <CardDescription>
                Tu cuenta tiene permisos para agregar contenido en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/plataforma/panel">Ir al panel</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Permisos</CardTitle>
              <CardDescription>
                Para agregar contenido necesitas el rol de Administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pide a un administrador que te habilite el rol.
            </CardContent>
          </Card>
        )}
      </div>
    </ApplicationShell09>
  );
}
