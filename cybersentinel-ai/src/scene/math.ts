export function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, v: number) {
  if (Math.abs(b - a) < 1e-6) return 0;
  return clamp((v - a) / (b - a));
}

export function smoothstep(a: number, b: number, v: number) {
  const t = inverseLerp(a, b, v);
  return t * t * (3 - 2 * t);
}

export function smootherstep(a: number, b: number, v: number) {
  const t = inverseLerp(a, b, v);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function band(
  v: number,
  start: number,
  peakStart: number,
  peakEnd: number,
  end: number,
) {
  if (v <= start || v >= end) return 0;
  if (v < peakStart) return smoothstep(start, peakStart, v);
  if (v > peakEnd) return 1 - smoothstep(peakEnd, end, v);
  return 1;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
  out: { r: number; g: number; b: number },
) {
  out.r = lerp(a.r, b.r, t);
  out.g = lerp(a.g, b.g, t);
  out.b = lerp(a.b, b.b, t);
  return out;
}
