"use client";

import * as React from "react";

import { createClient } from "@/lib/client";
import ApplicationShell09 from "@/plataforma/components/app/application-shell-09/page";
import { Button } from "@/plataforma/components/ui/button";
import { Input } from "@/plataforma/components/ui/input";

function md5(input: string) {
  const rotateLeft = (value: number, shift: number) => (value << shift) | (value >>> (32 - shift));
  const add = (x: number, y: number) => {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >>> 16) + (y >>> 16) + (lsw >>> 16);
    return (msw << 16) | (lsw & 0xffff);
  };
  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) =>
    add(rotateLeft(add(add(a, q), add(x, t)), s), b);
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(c ^ (b | ~d), a, b, x, s, t);

  const toWordArray = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    const words: number[] = [];
    for (let i = 0; i < bytes.length; i++) {
      words[i >> 2] = (words[i >> 2] ?? 0) | (bytes[i] << ((i % 4) * 8));
    }
    const bitLen = bytes.length * 8;
    words[bitLen >> 5] = (words[bitLen >> 5] ?? 0) | (0x80 << (bitLen % 32));
    words[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen;
    return words;
  };

  const wordToHex = (value: number) => {
    let out = "";
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      out += byte.toString(16).padStart(2, "0");
    }
    return out;
  };

  const x = toWordArray(input);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let i = 0; i < x.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, x[i + 0] ?? 0, 7, 0xd76aa478);
    d = ff(d, a, b, c, x[i + 1] ?? 0, 12, 0xe8c7b756);
    c = ff(c, d, a, b, x[i + 2] ?? 0, 17, 0x242070db);
    b = ff(b, c, d, a, x[i + 3] ?? 0, 22, 0xc1bdceee);
    a = ff(a, b, c, d, x[i + 4] ?? 0, 7, 0xf57c0faf);
    d = ff(d, a, b, c, x[i + 5] ?? 0, 12, 0x4787c62a);
    c = ff(c, d, a, b, x[i + 6] ?? 0, 17, 0xa8304613);
    b = ff(b, c, d, a, x[i + 7] ?? 0, 22, 0xfd469501);
    a = ff(a, b, c, d, x[i + 8] ?? 0, 7, 0x698098d8);
    d = ff(d, a, b, c, x[i + 9] ?? 0, 12, 0x8b44f7af);
    c = ff(c, d, a, b, x[i + 10] ?? 0, 17, 0xffff5bb1);
    b = ff(b, c, d, a, x[i + 11] ?? 0, 22, 0x895cd7be);
    a = ff(a, b, c, d, x[i + 12] ?? 0, 7, 0x6b901122);
    d = ff(d, a, b, c, x[i + 13] ?? 0, 12, 0xfd987193);
    c = ff(c, d, a, b, x[i + 14] ?? 0, 17, 0xa679438e);
    b = ff(b, c, d, a, x[i + 15] ?? 0, 22, 0x49b40821);

    a = gg(a, b, c, d, x[i + 1] ?? 0, 5, 0xf61e2562);
    d = gg(d, a, b, c, x[i + 6] ?? 0, 9, 0xc040b340);
    c = gg(c, d, a, b, x[i + 11] ?? 0, 14, 0x265e5a51);
    b = gg(b, c, d, a, x[i + 0] ?? 0, 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[i + 5] ?? 0, 5, 0xd62f105d);
    d = gg(d, a, b, c, x[i + 10] ?? 0, 9, 0x02441453);
    c = gg(c, d, a, b, x[i + 15] ?? 0, 14, 0xd8a1e681);
    b = gg(b, c, d, a, x[i + 4] ?? 0, 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[i + 9] ?? 0, 5, 0x21e1cde6);
    d = gg(d, a, b, c, x[i + 14] ?? 0, 9, 0xc33707d6);
    c = gg(c, d, a, b, x[i + 3] ?? 0, 14, 0xf4d50d87);
    b = gg(b, c, d, a, x[i + 8] ?? 0, 20, 0x455a14ed);
    a = gg(a, b, c, d, x[i + 13] ?? 0, 5, 0xa9e3e905);
    d = gg(d, a, b, c, x[i + 2] ?? 0, 9, 0xfcefa3f8);
    c = gg(c, d, a, b, x[i + 7] ?? 0, 14, 0x676f02d9);
    b = gg(b, c, d, a, x[i + 12] ?? 0, 20, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[i + 5] ?? 0, 4, 0xfffa3942);
    d = hh(d, a, b, c, x[i + 8] ?? 0, 11, 0x8771f681);
    c = hh(c, d, a, b, x[i + 11] ?? 0, 16, 0x6d9d6122);
    b = hh(b, c, d, a, x[i + 14] ?? 0, 23, 0xfde5380c);
    a = hh(a, b, c, d, x[i + 1] ?? 0, 4, 0xa4beea44);
    d = hh(d, a, b, c, x[i + 4] ?? 0, 11, 0x4bdecfa9);
    c = hh(c, d, a, b, x[i + 7] ?? 0, 16, 0xf6bb4b60);
    b = hh(b, c, d, a, x[i + 10] ?? 0, 23, 0xbebfbc70);
    a = hh(a, b, c, d, x[i + 13] ?? 0, 4, 0x289b7ec6);
    d = hh(d, a, b, c, x[i + 0] ?? 0, 11, 0xeaa127fa);
    c = hh(c, d, a, b, x[i + 3] ?? 0, 16, 0xd4ef3085);
    b = hh(b, c, d, a, x[i + 6] ?? 0, 23, 0x04881d05);
    a = hh(a, b, c, d, x[i + 9] ?? 0, 4, 0xd9d4d039);
    d = hh(d, a, b, c, x[i + 12] ?? 0, 11, 0xe6db99e5);
    c = hh(c, d, a, b, x[i + 15] ?? 0, 16, 0x1fa27cf8);
    b = hh(b, c, d, a, x[i + 2] ?? 0, 23, 0xc4ac5665);

    a = ii(a, b, c, d, x[i + 0] ?? 0, 6, 0xf4292244);
    d = ii(d, a, b, c, x[i + 7] ?? 0, 10, 0x432aff97);
    c = ii(c, d, a, b, x[i + 14] ?? 0, 15, 0xab9423a7);
    b = ii(b, c, d, a, x[i + 5] ?? 0, 21, 0xfc93a039);
    a = ii(a, b, c, d, x[i + 12] ?? 0, 6, 0x655b59c3);
    d = ii(d, a, b, c, x[i + 3] ?? 0, 10, 0x8f0ccc92);
    c = ii(c, d, a, b, x[i + 10] ?? 0, 15, 0xffeff47d);
    b = ii(b, c, d, a, x[i + 1] ?? 0, 21, 0x85845dd1);
    a = ii(a, b, c, d, x[i + 8] ?? 0, 6, 0x6fa87e4f);
    d = ii(d, a, b, c, x[i + 15] ?? 0, 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[i + 6] ?? 0, 15, 0xa3014314);
    b = ii(b, c, d, a, x[i + 13] ?? 0, 21, 0x4e0811a1);
    a = ii(a, b, c, d, x[i + 4] ?? 0, 6, 0xf7537e82);
    d = ii(d, a, b, c, x[i + 11] ?? 0, 10, 0xbd3af235);
    c = ii(c, d, a, b, x[i + 2] ?? 0, 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[i + 9] ?? 0, 21, 0xeb86d391);

    a = add(a, oa);
    b = add(b, ob);
    c = add(c, oc);
    d = add(d, od);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

type ProfileRow = {
  id: string;
  full_name?: string | null;
  nickname?: string | null;
  art_type?: string | null;
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
  const [email, setEmail] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [artType, setArtType] = React.useState("");
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
        setEmail(user?.email ?? null);

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
    facebook,
    fullName,
    instagram,
    nickname,
    phone,
    userId,
  ]);

  const emailHash = React.useMemo(() => {
    const normalized = (email ?? "").trim().toLowerCase();
    if (!normalized) return null;
    return md5(normalized);
  }, [email]);

  const avatarSrc = React.useMemo(() => {
    if (!emailHash) return null;
    const size = 96;
    return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=identicon`;
  }, [emailHash]);

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
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                    </div>
                      <div className="text-sm text-muted-foreground">
                        Se genera automáticamente con tu correo (Gravatar).
                      </div>
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
