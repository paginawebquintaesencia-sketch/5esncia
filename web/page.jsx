import Banner from "./componts/banner";
import Navbar from "./componts/navbar";

export default function WebPage() {
  return (
    <div
      className="flex min-h-full flex-col transition-[padding] duration-300"
      style={{ paddingTop: "var(--banner-offset, 0px)" }}
    >
      <Banner />
      <div className="sticky top-0 z-40">
        <Navbar />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <section id="inicio">
          <h1 className="text-2xl font-semibold">Inicio</h1>
        </section>

      </main>
    </div>
  );
}
