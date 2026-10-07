import { mulberry32 } from "./math";
import type { NetEdge, NetNode, NetworkData } from "./types";

export const CLUSTER_META = [
  { name: "BENIGN", color: "#2563eb" },
  { name: "DDoS", color: "#dc2626" },
  { name: "PORTSCAN", color: "#d97706" },
  { name: "DoS ATTACK", color: "#e11d48" },
  { name: "BOT", color: "#7c3aed" },
  { name: "FTP-PATATOR", color: "#ca8a04" },
  { name: "SSH-PATATOR", color: "#0f766e" },
  { name: "WEB ATTACK", color: "#be123c" },
] as const;

export const FEATURE_LABELS = [
  "FLOW DURATION",
  "PACKETS / SEC",
  "BYTES / SEC",
  "PROTOCOL",
  "SOURCE PORT",
  "DESTINATION PORT",
  "PACKET LENGTH",
  "TCP FLAGS",
] as const;

export const FEATURE_EXAMPLES = [
  "FLOW DURATION",
  "PACKETS/SEC",
  "BYTES/SEC",
  "TCP FLAGS",
  "FORWARD PACKETS",
  "BACKWARD PACKETS",
  "FLOW BYTES/SEC",
] as const;

function dist(a: NetNode, b: NetNode) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function generateNetwork(count: number, seed = 7): NetworkData {
  const rand = mulberry32(seed);
  const nodes: NetNode[] = [];

  const clusterCenters = CLUSTER_META.map((_, i) => {
    const a = (i / CLUSTER_META.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(a) * 18,
      y: Math.sin(i * 1.35) * 3.4,
      z: Math.sin(a) * 13 - 4,
    };
  });

  const weights = [0.42, 0.14, 0.1, 0.1, 0.08, 0.06, 0.05, 0.05];

  for (let i = 0; i < count; i++) {
    const golden = (1 + Math.sqrt(5)) / 2;
    const yNorm = 1 - (i / Math.max(count - 1, 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const theta = (2 * Math.PI * i) / golden;
    const shell = 11 + rand() * 10;
    const stretchY = 0.52;
    let x = Math.cos(theta) * radius * shell;
    let y = yNorm * shell * stretchY;
    let z = Math.sin(theta) * radius * shell * 1.05;

    x += (rand() - 0.5) * 3.2;
    y += (rand() - 0.5) * 2.2;
    z += (rand() - 0.5) * 3.6;

    if (rand() < 0.18) {
      const arm = Math.floor(rand() * 5);
      const armA = arm * 1.256;
      const t = rand();
      x += Math.cos(armA) * t * 8;
      z += Math.sin(armA) * t * 8;
      y += (rand() - 0.5) * 2;
    }

    let r = rand();
    let cluster = 0;
    let acc = 0;
    for (let c = 0; c < weights.length; c++) {
      acc += weights[c];
      if (r <= acc) {
        cluster = c;
        break;
      }
    }

    const hub = rand() < 0.055;
    const scale = hub ? 1.7 + rand() * 0.6 : 0.72 + rand() * 0.55;

    const cc = clusterCenters[cluster];
    const spread = cluster === 0 ? 5.5 : 3.4;
    const cx = cc.x + (rand() - 0.5) * spread;
    const cy = cc.y + (rand() - 0.5) * spread * 0.55;
    const cz = cc.z + (rand() - 0.5) * spread;

    nodes.push({
      x,
      y,
      z,
      ox: x,
      oy: y,
      oz: z,
      cx,
      cy,
      cz,
      cluster,
      scale,
      hub,
      onAttackPath: false,
    });
  }

  const edges: NetEdge[] = [];
  const seen = new Set<string>();
  const k = 3;

  for (let i = 0; i < nodes.length; i++) {
    const dists: { j: number; d: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      dists.push({ j, d: dist(nodes[i], nodes[j]) });
    }
    dists.sort((a, b) => a.d - b.d);
    const links = nodes[i].hub ? k + 2 : k;
    for (let n = 0; n < links; n++) {
      const j = dists[n].j;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b, onAttackPath: false, length: dists[n].d });
    }
  }

  const byZ = nodes
    .map((_, i) => i)
    .sort((a, b) => nodes[b].z - nodes[a].z);

  const attackPath: number[] = [];
  let current = byZ[Math.floor(byZ.length * 0.08)];
  attackPath.push(current);
  const used = new Set<number>([current]);

  for (let step = 0; step < 14; step++) {
    let best = -1;
    let bestScore = Infinity;
    for (const e of edges) {
      const other = e.a === current ? e.b : e.b === current ? e.a : -1;
      if (other < 0 || used.has(other)) continue;
      const n = nodes[other];
      const score = n.z + Math.abs(n.x) * 0.15 + Math.abs(n.y) * 0.1;
      if (score < bestScore) {
        bestScore = score;
        best = other;
      }
    }
    if (best < 0) break;
    used.add(best);
    attackPath.push(best);
    current = best;
  }

  const pathSet = new Set(attackPath);
  for (const n of attackPath) nodes[n].onAttackPath = true;
  for (const e of edges) {
    if (pathSet.has(e.a) && pathSet.has(e.b)) {
      const ia = attackPath.indexOf(e.a);
      const ib = attackPath.indexOf(e.b);
      if (ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1) e.onAttackPath = true;
    }
  }

  return { nodes, edges, attackPath, clusterCenters };
}

export function pickLabelNodes(nodes: NetNode[], count: number) {
  const mid = nodes
    .map((n, i) => ({ i, z: n.z, hub: n.hub }))
    .filter((n) => n.z > -6 && n.z < 10)
    .sort((a, b) => Number(b.hub) - Number(a.hub));
  const out: number[] = [];
  for (const n of mid) {
    if (out.length >= count) break;
    const tooClose = out.some((j) => {
      const a = nodes[n.i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      return dx * dx + dy * dy + dz * dz < 36;
    });
    if (!tooClose) out.push(n.i);
  }
  while (out.length < count && out.length < nodes.length) {
    out.push(Math.floor((out.length * 17 + 3) % nodes.length));
  }
  return out;
}
