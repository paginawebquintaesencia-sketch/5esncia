"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

const defaultTabs = [
  { label: "Inicio", href: "#inicio" },
  { label: "Galeria", href: "#galeria" },
  { label: "Concepto", href: "#concepto" },
  { label: "Artistas", href: "#artistas" },
  { label: "Coleciones", href: "#coleciones" },
];

export default function Navbar({
  tabs = defaultTabs,
  contactHref = "#contacto",
  loginHref = "/entrar",
}) {
  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "w-full transition-colors duration-200",
        hasScrolled
          ? "border-b border-black/10 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40"
          : "border-b border-transparent bg-transparent shadow-none",
      ].join(" ")}
      style={{
        fontFamily:
          'Gilmer, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-4 sm:py-4">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dd43a8]/40 dark:hover:bg-white/10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5 text-black/80 dark:text-white/80"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <a
          href="#inicio"
          className="justify-self-end"
          aria-label="Inicio"
        >
          <Image
            src="/iso.svg"
            alt="Iso"
            width={80}
            height={80}
            priority
            className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20"
          />
        </a>
      </div>

      <div
        className={[
          "fixed inset-x-0 bottom-0 z-[60]",
          "transition-opacity duration-200",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        style={{ top: "var(--banner-offset, 0px)" }}
        aria-hidden={!isMenuOpen}
      >
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          className={[
            "absolute inset-0 flex flex-col",
            "bg-white text-black",
            "transition-transform duration-200",
            isMenuOpen ? "translate-y-0" : "-translate-y-2",
          ].join(" ")}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Cerrar"
              className="inline-flex h-11 w-11 items-center justify-center text-black/80 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dd43a8]/40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-6 w-6"
              >
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 overflow-y-auto px-4 pb-10 sm:px-6 sm:pb-12">
            <nav className="flex flex-col gap-5 sm:gap-6">
              {tabs.map((tab) => (
                <a
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-fit text-4xl font-extrabold tracking-tight text-[#222C47] transition-colors hover:text-[#dd43a8] sm:text-5xl lg:text-6xl"
                >
                  {tab.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-wrap gap-4 pt-6">
              <a
                href={contactHref}
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center gap-3 rounded-xl bg-[#f07a2b] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Contacto
                <span aria-hidden="true">→</span>
              </a>
              <a
                href={loginHref}
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center gap-3 rounded-xl bg-[#dd43a8] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Entrar
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
