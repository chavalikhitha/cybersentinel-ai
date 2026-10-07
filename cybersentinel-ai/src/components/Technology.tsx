import { ARCHITECTURE, FEATURE_CATALOG, PIPELINE } from "@/lib/data";
import { Logo } from "./Logo";

export function Technology({
  onBack,
  onLaunch,
}: {
  onBack: () => void;
  onLaunch: () => void;
}) {
  return (
    <div className="view-fade min-h-screen bg-mist text-ink">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <button onClick={onBack}>
          <Logo />
        </button>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[11px] tracking-[0.16em] text-slate-400 uppercase hover:text-navy">
            Experience
          </button>
          <button
            onClick={onLaunch}
            className="rounded-full bg-navy px-5 py-2 text-[11px] font-semibold tracking-[0.16em] text-white uppercase"
          >
            Launch Dashboard →
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-10 md:px-12">
        <p className="font-mono text-[11px] tracking-[0.32em] text-blue-600/80">DATA WAREHOUSE & DATA MINING</p>
        <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[0.95] font-extrabold text-navy md:text-7xl">
          From packets
          <br />
          to prediction.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
          CyberSentinel AI is a complete DWDM system: a warehouse of network flows, a 78-dimensional feature store, and a mining
          stack that forecasts attacks before the session ends.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 md:grid-cols-5 md:px-12">
        {PIPELINE.map((p) => (
          <article key={p.step} className="rounded-2xl border border-white bg-white/75 p-5 shadow-sm">
            <p className="font-mono text-[11px] text-blue-600">{p.step}</p>
            <h2 className="font-display mt-2 text-xl font-bold text-navy">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-5xl px-6 md:px-12">
        <p className="font-mono text-[11px] tracking-[0.28em] text-slate-400">ARCHITECTURE</p>
        <h2 className="font-display mt-3 text-4xl font-bold text-navy">A warehouse built for mining.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {ARCHITECTURE.map((a) => (
            <div key={a.layer} className="rounded-2xl bg-white/80 p-5">
              <p className="font-display text-lg font-bold text-navy">{a.layer}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-500">
                {a.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-5xl px-6 pb-24 md:px-12">
        <p className="font-mono text-[11px] tracking-[0.28em] text-slate-400">78 NETWORK FEATURES</p>
        <h2 className="font-display mt-3 text-4xl font-bold text-navy">The language of a flow.</h2>
        <p className="mt-3 max-w-2xl text-slate-500">
          Duration, rates, inter-arrival times, TCP flags, window sizes, active and idle bursts — statistical signatures that
          separate a handshake from a flood.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CATALOG.map((f) => (
            <div key={f.name} className="rounded-2xl border border-white bg-white/70 p-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-blue-600">{f.group}</p>
              <p className="mt-1 text-sm font-medium text-navy">{f.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
