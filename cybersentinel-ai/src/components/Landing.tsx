import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CyberScene } from "@/scene/CyberScene";
import { band } from "@/scene/math";
import type { ScreenLabel } from "@/scene/types";
import { Logo } from "./Logo";

gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = [
  { t: 0.0, name: "Origin" },
  { t: 0.16, name: "Network" },
  { t: 0.3, name: "Anomaly" },
  { t: 0.46, name: "Analysis" },
  { t: 0.58, name: "Forecast" },
  { t: 0.68, name: "Protect" },
  { t: 0.78, name: "Intelligence" },
  { t: 0.88, name: "Console" },
  { t: 0.96, name: "Enter" },
];

function Overlay({
  opacity,
  className,
  children,
}: {
  opacity: number;
  className?: string;
  children: ReactNode;
}) {
  if (opacity < 0.02) return null;
  return (
    <div
      className={className}
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 22}px)`,
        pointerEvents: opacity > 0.35 ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

export function Landing({
  onLaunch,
  onTech,
}: {
  onLaunch: () => void;
  onTech: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const readyRef = useRef(false);
  const lastUi = useRef(0);
  const [progress, setProgress] = useState(0);
  const [prediction, setPrediction] = useState(0);
  const [labels, setLabels] = useState<ScreenLabel[]>([]);
  const [ready, setReady] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
    let scene: CyberScene;
    try {
      scene = new CyberScene(canvas, {
        mobile,
        reducedMotion: reduced,
        onFrame: (info) => {
          if (!readyRef.current) {
            readyRef.current = true;
            setReady(true);
          }
          const now = performance.now();
          if (now - lastUi.current < 48) return;
          lastUi.current = now;
          setProgress(info.progress);
          setPrediction(info.prediction);
          setLabels(info.labels);
        },
      });
    } catch {
      setWebglError(true);
      return;
    }

    window.scrollTo(0, 0);
    const resize = () => scene.resize(window.innerWidth, window.innerHeight);
    resize();
    scene.start();
    window.addEventListener("resize", resize);

    let lenis: Lenis | null = null;
    let ticker: ((time: number) => void) | null = null;
    let trigger: ScrollTrigger | undefined;

    if (!reduced) {
      lenis = new Lenis({
        lerp: 0.075,
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      ticker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      trigger = ScrollTrigger.create({
        trigger: "#cs-scroll",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.15,
        onUpdate: (self) => {
          scene.setProgress(self.progress);
        },
      });
    } else {
      trigger = ScrollTrigger.create({
        trigger: "#cs-scroll",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => scene.setProgress(self.progress),
      });
    }

    return () => {
      window.removeEventListener("resize", resize);
      trigger?.kill();
      if (ticker) gsap.ticker.remove(ticker);
      lenis?.destroy();
      scene.dispose();
    };
  }, [reduced]);

  const scrollTo = (t: number) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const top = t * max;
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.35 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const hero = band(progress, 0, 0, 0.07, 0.14);
  const enterCopy = band(progress, 0.12, 0.16, 0.22, 0.3);
  const anomalyCopy = band(progress, 0.26, 0.3, 0.36, 0.42);
  const analysisCopy = band(progress, 0.4, 0.45, 0.52, 0.58);
  const predictCopy = band(progress, 0.52, 0.56, 0.63, 0.68);
  const detectW = band(progress, 0.64, 0.66, 0.69, 0.73);
  const predictW = band(progress, 0.68, 0.7, 0.73, 0.77);
  const protectW = band(progress, 0.72, 0.74, 0.78, 0.84);
  const miningA = band(progress, 0.74, 0.78, 0.82, 0.86);
  const miningB = band(progress, 0.8, 0.83, 0.86, 0.9);
  const dashCopy = band(progress, 0.84, 0.87, 0.91, 0.95);
  const finale = band(progress, 0.92, 0.95, 1, 1.05);
  const features = band(progress, 0.42, 0.46, 0.54, 0.6);

  return (
    <div className="relative bg-mist text-ink">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 h-full w-full"
        style={{ pointerEvents: "none" }}
      />

      <div id="cs-scroll" className="relative z-10" style={{ height: reduced ? "900vh" : "920vh" }} />

      <div className="pointer-events-none fixed inset-0 z-20">
        <header className="pointer-events-auto flex items-center justify-between px-5 py-5 md:px-10">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              onClick={onTech}
              className="hidden text-[11px] font-medium tracking-[0.16em] text-navy/55 uppercase transition hover:text-navy md:inline"
            >
              Technology
            </button>
            <button
              onClick={onLaunch}
              className="rounded-full border border-navy/10 bg-white/70 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-navy uppercase backdrop-blur-md transition hover:border-navy/25 hover:bg-white"
            >
              Launch Dashboard
            </button>
          </div>
        </header>

        <div className="absolute top-0 left-0 h-[2px] bg-blue-600/80" style={{ width: `${progress * 100}%` }} />

        <nav className="pointer-events-auto absolute top-1/2 right-4 hidden -translate-y-1/2 flex-col gap-3 md:flex">
          {CHAPTERS.map((c, i) => {
            const active = Math.abs(progress - c.t) < 0.055 || (i === CHAPTERS.length - 1 && progress > 0.94);
            const passed = progress >= c.t;
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => scrollTo(c.t)}
                className="group flex items-center justify-end gap-2"
              >
                <span className="font-mono text-[9px] tracking-[0.18em] text-navy/0 uppercase transition group-hover:text-navy/50">
                  {c.name}
                </span>
                <span
                  className="block h-1.5 w-1.5 rounded-full border border-navy/30 transition"
                  style={{
                    background: active ? "#2563eb" : passed ? "rgba(11,31,58,0.35)" : "transparent",
                    transform: active ? "scale(1.35)" : "scale(1)",
                  }}
                />
              </button>
            );
          })}
        </nav>

        <Overlay
          opacity={hero}
          className="absolute top-[22%] left-6 max-w-[640px] md:left-16 lg:left-24"
        >
          <p className="font-mono text-[11px] tracking-[0.32em] text-blue-600/80">CYBERSENTINEL AI</p>
          <h1 className="font-display mt-5 text-[42px] leading-[0.95] font-extrabold text-navy sm:text-6xl lg:text-[84px]">
            Predict the attack.
            <br />
            Before it happens.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-500">
            AI-powered network attack forecasting from network traffic data.
          </p>
          <button
            onClick={() => scrollTo(0.16)}
            className="mt-10 inline-flex items-center gap-3 text-[12px] font-semibold tracking-[0.2em] text-navy uppercase"
          >
            Explore CyberSentinel
            <span className="inline-block animate-bounce">↓</span>
          </button>
        </Overlay>

        <Overlay
          opacity={enterCopy}
          className="absolute top-[18%] left-6 max-w-lg md:left-16"
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-blue-600/80">SCENE 02 — FLOW</p>
          <h2 className="font-display mt-4 text-4xl leading-[1.05] font-bold text-navy md:text-6xl">
            Every network flow
            <br />
            tells a story.
          </h2>
        </Overlay>

        <Overlay
          opacity={anomalyCopy}
          className="absolute top-[16%] left-1/2 w-[min(92vw,640px)] -translate-x-1/2 text-center"
        >
          <p className="font-mono text-[11px] tracking-[0.32em] text-red-500">ANOMALY DETECTED</p>
          <h2 className="font-display mt-4 text-4xl font-bold text-navy md:text-6xl">
            Suspicious network
            <br />
            behavior identified
          </h2>
        </Overlay>

        <Overlay
          opacity={analysisCopy}
          className="absolute top-[14%] left-6 max-w-xl md:left-16"
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-blue-600/80">SCENE 04 — CORE</p>
          <h2 className="font-display mt-4 text-4xl font-bold text-navy md:text-6xl">
            AI is analyzing
            <br />
            the network
          </h2>
          <p className="mt-5 font-mono text-sm tracking-[0.18em] text-slate-500">78 NETWORK FEATURES</p>
        </Overlay>

        <Overlay
          opacity={features}
          className="absolute right-8 bottom-[12%] hidden max-w-xs md:block"
        >
          <div className="glass rounded-2xl p-5">
            <p className="font-mono text-[10px] tracking-[0.22em] text-slate-400">FEATURE VECTOR</p>
            <ul className="mt-3 space-y-1.5 font-mono text-[11px] tracking-[0.14em] text-navy/70">
              {["FLOW DURATION", "PACKETS/SEC", "BYTES/SEC", "TCP FLAGS", "FORWARD PACKETS", "BACKWARD PACKETS", "FLOW BYTES/SEC"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-500" />
                    {f}
                  </li>
                ),
              )}
            </ul>
          </div>
        </Overlay>

        <Overlay
          opacity={predictCopy}
          className="absolute top-1/2 left-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="glass relative overflow-hidden rounded-[28px] px-8 py-10 text-center md:px-12">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: "inset 0 0 80px rgba(220,38,38,0.08)",
              }}
            />
            <p className="font-mono text-[11px] tracking-[0.3em] text-slate-500">ATTACK PREDICTION</p>
            <div className="font-display mt-4 text-[88px] leading-none font-extrabold text-navy md:text-[120px]">
              {prediction}
              <span className="text-4xl text-slate-400">%</span>
            </div>
            <p className="mt-2 text-lg font-medium tracking-[0.12em] text-navy/70">ATTACK RISK</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" style={{ animation: "pulse-soft 1.4s ease infinite" }} />
              HIGH RISK
            </div>
          </div>
        </Overlay>

        <Overlay
          opacity={Math.max(detectW, predictW, protectW)}
          className="absolute top-[18%] left-1/2 -translate-x-1/2 text-center"
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            {([
              ["DETECT", detectW],
              ["PREDICT", predictW],
              ["PROTECT", protectW],
            ] as const).map(([word, o]) => (
              <h2
                key={word}
                className="font-display text-5xl font-extrabold tracking-tight text-navy md:text-7xl"
                style={{ opacity: Math.max(0.12, o), transform: `scale(${0.96 + o * 0.04})` }}
              >
                {word}
              </h2>
            ))}
          </div>
        </Overlay>

        <Overlay
          opacity={miningA}
          className="absolute top-[12%] left-6 md:left-16"
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-blue-600/80">DATA MINING</p>
          <h2 className="font-display mt-3 text-4xl font-bold text-navy md:text-6xl">
            From raw
            <br />
            network data
          </h2>
        </Overlay>

        <Overlay
          opacity={miningB}
          className="absolute right-6 bottom-[16%] text-right md:right-16"
        >
          <h2 className="font-display text-4xl font-bold text-navy md:text-6xl">
            To actionable
            <br />
            intelligence
          </h2>
        </Overlay>

        <Overlay
          opacity={dashCopy}
          className="absolute top-1/2 left-1/2 w-[min(94vw,860px)] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { k: "PREDICTION", v: "DDoS", s: "SYN flood pattern" },
              { k: "CONFIDENCE", v: "87%", s: "calibrated probability" },
              { k: "RISK", v: "HIGH", s: "block recommended" },
            ].map((card) => (
              <div key={card.k} className="glass rounded-2xl px-6 py-7">
                <p className="font-mono text-[10px] tracking-[0.22em] text-slate-400">{card.k}</p>
                <p className="font-display mt-3 text-4xl font-bold text-navy">{card.v}</p>
                <p className="mt-2 text-xs text-slate-500">{card.s}</p>
              </div>
            ))}
          </div>
        </Overlay>

        <Overlay
          opacity={finale}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="font-mono text-[11px] tracking-[0.32em] text-blue-600/80">CYBERSENTINEL AI</p>
          <h2 className="font-display mt-5 max-w-4xl text-5xl leading-[0.95] font-extrabold text-navy sm:text-7xl">
            Predict the attack.
            <br />
            Before it happens.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-500">
            Detect anomalies.
            <br />
            Analyze network traffic.
            <br />
            Forecast cyberattacks.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <button
              onClick={onLaunch}
              className="rounded-full bg-navy px-8 py-3.5 text-[12px] font-semibold tracking-[0.18em] text-white uppercase shadow-xl shadow-slate-300 transition hover:bg-blue-700"
            >
              Launch Dashboard →
            </button>
            <button
              onClick={onTech}
              className="rounded-full border border-navy/15 bg-white/60 px-8 py-3.5 text-[12px] font-semibold tracking-[0.18em] text-navy uppercase backdrop-blur-md transition hover:bg-white"
            >
              Explore the Technology
            </button>
          </div>
        </Overlay>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.24em] text-navy/35 uppercase md:hidden">
          {CHAPTERS.reduce((name, c) => (progress >= c.t - 0.02 ? c.name : name), CHAPTERS[0].name)}
        </div>

        {labels.map((l) => (
          <div
            key={l.key}
            className="holo pointer-events-none absolute top-0 left-0 rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] whitespace-nowrap text-navy/80"
            style={{
              transform: `translate(${l.x}px, ${l.y}px) translate(-50%, -130%)`,
              opacity: l.opacity,
              borderColor: l.accent === "red" ? "rgba(220,38,38,0.28)" : undefined,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>

      {!ready && !webglError && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mist">
          <Logo markClassName="h-10 w-10" />
          <p className="mt-8 font-mono text-[11px] tracking-[0.32em] text-slate-400">INITIALIZING NEURAL GRAPH</p>
          <div className="mt-6 h-[1px] w-40 overflow-hidden bg-slate-200">
            <div className="h-full w-1/2 bg-blue-600" style={{ animation: "pulse-soft 1.2s ease infinite" }} />
          </div>
        </div>
      )}

      {webglError && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mist px-6 text-center">
          <h1 className="font-display text-4xl font-bold text-navy">CyberSentinel AI</h1>
          <p className="mt-4 max-w-md text-slate-500">
            This experience needs WebGL. You can still open the prediction dashboard.
          </p>
          <button
            onClick={onLaunch}
            className="mt-8 rounded-full bg-navy px-8 py-3 text-xs tracking-[0.18em] text-white uppercase"
          >
            Launch Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
