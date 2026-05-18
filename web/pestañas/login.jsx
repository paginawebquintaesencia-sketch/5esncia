"use client";

import { createClient } from "../../lib/client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

function Field({
  label,
  type = "text",
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
}) {
  const id = useId();

  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-black/70">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-black outline-none transition-colors placeholder:text-black/35 focus:border-black/20 focus:ring-2 focus:ring-black/10"
      />
    </label>
  );
}

export default function LoginAndRegister() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [newsOptIn, setNewsOptIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOauthLoading, setIsOauthLoading] = useState(false);
  const [isHelping, setIsHelping] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    let isAlive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isAlive) return;
      if (data.user) {
        router.replace("/plataforma");
        router.refresh();
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      router.replace("/plataforma");
      router.refresh();
    });

    return () => {
      isAlive = false;
      data.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const canRegister =
    Boolean(name.trim()) &&
    Boolean(registerEmail.trim()) &&
    Boolean(registerPassword) &&
    registerPassword === registerConfirm;

  const normalizedError = (errorText || "").toLowerCase();
  const showHelpActions =
    normalizedError.includes("invalid login credentials") ||
    normalizedError.includes("email not confirmed") ||
    normalizedError.includes("not confirmed");

  const helpEmail = (mode === "login" ? loginEmail : registerEmail).trim();

  const onResendConfirmation = async () => {
    if (!helpEmail) {
      setErrorText("Escribe tu correo primero.");
      return;
    }

    setIsHelping(true);
    setErrorText("");
    setSuccessText("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: helpEmail,
      });

      if (error) {
        setErrorText(error.message);
        return;
      }

      setSuccessText("Listo. Revisa tu correo para confirmar tu cuenta.");
    } finally {
      setIsHelping(false);
    }
  };

  const onResetPassword = async () => {
    if (!helpEmail) {
      setErrorText("Escribe tu correo primero.");
      return;
    }

    setIsHelping(true);
    setErrorText("");
    setSuccessText("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(helpEmail);
      if (error) {
        setErrorText(error.message);
        return;
      }
      setSuccessText("Te enviamos un correo para restablecer tu contraseña.");
    } finally {
      setIsHelping(false);
    }
  };

  const onGoogle = async () => {
    setErrorText("");
    setSuccessText("");
    setIsOauthLoading(true);
    try {
      const redirectTo = `${window.location.origin}/entrar`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        setErrorText(error.message);
      }
    } finally {
      setIsOauthLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        if (!loginEmail.trim() || !loginPassword) {
          setErrorText("Completa tu correo y contraseña.");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

        if (error) {
          setErrorText(error.message);
          return;
        }

        router.replace("/plataforma");
        router.refresh();
        return;
      }

      if (!canRegister) {
        setErrorText("Revisa tus datos para crear la cuenta.");
        return;
      }

      const { error, data } = await supabase.auth.signUp({
        email: registerEmail.trim(),
        password: registerPassword,
        options: {
          data: {
            full_name: name.trim(),
            news_opt_in: newsOptIn,
          },
        },
      });

      if (error) {
        setErrorText(error.message);
        return;
      }

      if (data?.user && !data?.session) {
        setSuccessText("Cuenta creada. Revisa tu correo para confirmar el acceso.");
      } else {
        setSuccessText("Cuenta creada. Ya puedes entrar.");
        router.replace("/plataforma");
        router.refresh();
      }
      setMode("login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setErrorText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white text-black"
      style={{
        fontFamily:
          'Gilmer, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-black">
            {mode === "register" ? "Crear una cuenta" : "Iniciar sesión"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-black/60">
            {mode === "register"
              ? "Te faltan pocos pasos para comenzar."
              : "Accede para gestionar tu perfil y tus obras."}
          </p>

          <form
            className="mt-6 grid gap-4"
            onSubmit={onSubmit}
          >
            {mode === "register" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nombre"
                    name="name"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    placeholder="Tu nombre"
                  />
                  <Field
                    label="Correo"
                    type="email"
                    name="registerEmail"
                    value={registerEmail}
                    onChange={setRegisterEmail}
                    autoComplete="email"
                    placeholder="tu@correo.com"
                  />
                  <Field
                    label="Contraseña"
                    type="password"
                    name="registerPassword"
                    value={registerPassword}
                    onChange={setRegisterPassword}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  <Field
                    label="Confirmar contraseña"
                    type="password"
                    name="registerConfirm"
                    value={registerConfirm}
                    onChange={setRegisterConfirm}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>

                <label className="flex items-center gap-3 text-sm font-semibold text-black/65">
                  <input
                    type="checkbox"
                    checked={newsOptIn}
                    onChange={(e) => setNewsOptIn(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20"
                  />
                  Envíame novedades y anuncios de la plataforma
                </label>

                <button
                  type="submit"
                  disabled={!canRegister || isSubmitting}
                  className={[
                    "mt-1 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-extrabold transition-opacity",
                    canRegister
                      ? isSubmitting
                        ? "bg-black text-white opacity-60"
                        : "bg-black text-white hover:opacity-90"
                      : "bg-black/20 text-black/50",
                  ].join(" ")}
                >
                  {isSubmitting ? "Creando..." : "Crear cuenta"}
                </button>

                <p className="text-xs font-semibold text-black/55">
                  Al registrarte aceptas los términos y la política de
                  privacidad.
                </p>

                {registerPassword &&
                registerConfirm &&
                registerPassword !== registerConfirm ? (
                  <p className="text-sm font-semibold text-[#dd43a8]">
                    Las contraseñas no coinciden.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <Field
                  label="Correo"
                  type="email"
                  name="loginEmail"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  autoComplete="email"
                  placeholder="tu@correo.com"
                />
                <Field
                  label="Contraseña"
                  type="password"
                  name="loginPassword"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={[
                    "mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-black px-5 text-sm font-extrabold text-white transition-opacity",
                    isSubmitting ? "opacity-60" : "hover:opacity-90",
                  ].join(" ")}
                >
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </button>

                <a
                  href="#"
                  className="text-sm font-semibold text-black/60 hover:text-black"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </>
            )}

            <div className="mt-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10" />
              <span className="text-xs font-semibold text-black/45">o</span>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            <button
              type="button"
              onClick={onGoogle}
              disabled={isOauthLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-extrabold text-black transition-colors hover:bg-black/[0.02]"
            >
              {isOauthLoading ? "Conectando..." : "Continuar con Google"}
            </button>

            {errorText ? (
              <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm font-semibold text-black/80">
                {errorText}
              </p>
            ) : null}

            {showHelpActions ? (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={onResendConfirmation}
                  disabled={isHelping}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-extrabold text-black transition-colors hover:bg-black/[0.02]"
                >
                  {isHelping ? "Enviando..." : "Reenviar confirmación"}
                </button>
                <button
                  type="button"
                  onClick={onResetPassword}
                  disabled={isHelping}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-extrabold text-black transition-colors hover:bg-black/[0.02]"
                >
                  {isHelping ? "Enviando..." : "Restablecer contraseña"}
                </button>
              </div>
            ) : null}
            {successText ? (
              <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm font-semibold text-black/80">
                {successText}
              </p>
            ) : null}

            <p className="pt-2 text-center text-sm font-semibold text-black/60">
              {mode === "register"
                ? "¿Ya tienes cuenta?"
                : "¿Aún no tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorText("");
                  setSuccessText("");
                  setMode(mode === "register" ? "login" : "register");
                }}
                className="font-extrabold text-black hover:text-[#dd43a8]"
              >
                {mode === "register" ? "Entrar" : "Crear cuenta"}
              </button>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
