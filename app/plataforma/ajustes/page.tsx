"use client";

import * as React from "react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Button } from "@/plataforma/components/ui/button";
import { Input } from "@/plataforma/components/ui/input";

type ProfileRow = {
  id: string;
  full_name?: string | null;
  nickname?: string | null;
  art_type?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

type TabKey =
  | "account"
  | "billing"
  | "appearance"
  | "notifications"
  | "integrations"
  | "privacy";

export default function Page() {
  const [tab, setTab] = React.useState<TabKey>("account");
  const [isLoading, setIsLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);

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
        setUserId(user?.id ?? null);

        if (!user) {
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
        if (!isAlive) return;
        setProfile(row);

        setFullName(row?.full_name ?? "");
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
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <div className="text-3xl font-semibold tracking-tight text-foreground">Settings</div>
            <div className="text-sm text-muted-foreground">
              Configura tu perfil y preferencias.
            </div>
          </div>
          <Button onClick={onSaveProfile} disabled={isSaving || isLoading || !userId}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

        <div className="mt-5 border-b border-foreground/10">
          <nav className="-mb-px flex flex-wrap gap-6 text-sm font-medium">
            {(
              [
                { key: "account", label: "Account Settings" },
                { key: "billing", label: "Billing & Subscription" },
                { key: "appearance", label: "Appearance" },
                { key: "notifications", label: "Notifications" },
                { key: "integrations", label: "Integrations" },
                { key: "privacy", label: "Privacy & Data" },
              ] as const
            ).map((item) => {
              const isActive = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={[
                    "border-b-2 px-1 py-3 transition-colors",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 grid gap-8 rounded-2xl border border-foreground/10 bg-background p-6">
          {tab !== "account" ? (
            <div className="text-sm text-muted-foreground">
              Esta sección se configura después.
            </div>
          ) : !userId && !isLoading ? (
            <div className="text-sm text-muted-foreground">
              Inicia sesión para editar tu perfil.
            </div>
          ) : (
            <div className="grid gap-8">
              <div className="grid gap-1">
                <div className="text-base font-semibold text-foreground">Profile Information</div>
                <div className="text-sm text-muted-foreground">
                  Mantén tus datos al día para que otros puedan encontrarte.
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Profile Picture</div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
                      {avatarUrl.trim() ? (
                        <img
                          src={avatarUrl.trim()}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAvatarUrl("")}
                        disabled={!avatarUrl.trim()}
                      >
                        Eliminar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const el = document.getElementById("avatar-url");
                          if (el instanceof HTMLInputElement) el.focus();
                        }}
                      >
                        Actualizar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Nombre</div>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Usuario (nickname)</div>
                  <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </div>

                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Tipo de arte</div>
                  <Input value={artType} onChange={(e) => setArtType(e.target.value)} />
                </div>

                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Número de celular</div>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Avatar (URL)</div>
                  <Input
                    id="avatar-url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid gap-4 border-b border-foreground/10 pb-6 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Instagram</div>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                </div>

                <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-sm font-medium text-foreground">Facebook</div>
                  <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                </div>

                {saveError ? (
                  <div className="text-sm text-muted-foreground">{saveError}</div>
                ) : null}
                {saveSuccess ? (
                  <div className="text-sm text-muted-foreground">{saveSuccess}</div>
                ) : null}
                {!isLoading && userId && !profile ? (
                  <div className="text-sm text-muted-foreground">
                    No se encontró tu perfil en la base de datos. Verifica que exista la fila en `profiles`.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </ApplicationShell09>
  );
}
