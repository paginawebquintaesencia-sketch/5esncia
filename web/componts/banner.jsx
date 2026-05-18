"use client";

import { useEffect, useRef, useState } from "react";

export default function Banner({ href = "/plataforma" }) {
  const [isVisible, setIsVisible] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY <= 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const setOffset = () => {
      const height = element.offsetHeight || 0;
      document.documentElement.style.setProperty(
        "--banner-offset",
        isVisible ? `${height}px` : "0px",
      );
    };

    setOffset();

    const resizeObserver = new ResizeObserver(() => setOffset());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.setProperty("--banner-offset", "0px");
    };
  }, [isVisible]);

  return (
    <div
      ref={rootRef}
      className={[
        "fixed inset-x-0 top-0 z-50",
        "transition-all duration-300",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
      role="region"
      aria-label="Banner"
    >
      <div className="bg-orange-500 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm">
          <span>Conoce que tipo de artista eres</span>
          <a
            href={href}
            className="font-semibold underline underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Ir ahora !
          </a>
        </div>
      </div>
    </div>
  );
}
