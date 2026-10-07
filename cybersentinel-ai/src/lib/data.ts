export type AttackClass =
  | "BENIGN"
  | "DDoS"
  | "PortScan"
  | "DoS"
  | "Bot"
  | "FTP-Patator"
  | "SSH-Patator"
  | "Web Attack";

export interface FlowRecord {
  id: string;
  timestamp: string;
  src: string;
  dst: string;
  srcPort: number;
  dstPort: number;
  protocol: "TCP" | "UDP" | "ICMP";
  durationMs: number;
  fwdPackets: number;
  bwdPackets: number;
  bytesPerSec: number;
  packetsPerSec: number;
  avgPktLen: number;
  flags: string;
  label: AttackClass;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
}

export interface WarehouseStat {
  label: string;
  value: string;
  hint: string;
}

export const ATTACK_COLORS: Record<AttackClass, string> = {
  BENIGN: "#2563eb",
  DDoS: "#dc2626",
  PortScan: "#d97706",
  DoS: "#e11d48",
  Bot: "#7c3aed",
  "FTP-Patator": "#ca8a04",
  "SSH-Patator": "#0f766e",
  "Web Attack": "#be123c",
};

export const FEATURE_CATALOG = [
  { name: "Flow Duration", group: "Temporal", desc: "Lifetime of the bidirectional flow in microseconds." },
  { name: "Total Fwd Packets", group: "Volume", desc: "Packet count from source to destination." },
  { name: "Total Bwd Packets", group: "Volume", desc: "Packet count from destination to source." },
  { name: "Flow Bytes/s", group: "Rate", desc: "Byte throughput of the entire flow." },
  { name: "Flow Packets/s", group: "Rate", desc: "Packet rate across the flow lifetime." },
  { name: "Fwd Packet Length Mean", group: "Size", desc: "Average forward packet size." },
  { name: "Bwd Packet Length Mean", group: "Size", desc: "Average backward packet size." },
  { name: "Flow IAT Mean", group: "Temporal", desc: "Mean inter-arrival time between packets." },
  { name: "Flow IAT Std", group: "Temporal", desc: "Burstiness of packet arrivals." },
  { name: "Fwd IAT Total", group: "Temporal", desc: "Sum of forward inter-arrival times." },
  { name: "Bwd IAT Total", group: "Temporal", desc: "Sum of backward inter-arrival times." },
  { name: "FIN Flag Count", group: "TCP", desc: "Count of packets with FIN set." },
  { name: "SYN Flag Count", group: "TCP", desc: "Count of packets with SYN set." },
  { name: "RST Flag Count", group: "TCP", desc: "Count of packets with RST set." },
  { name: "PSH Flag Count", group: "TCP", desc: "Count of packets with PSH set." },
  { name: "ACK Flag Count", group: "TCP", desc: "Count of packets with ACK set." },
  { name: "URG Flag Count", group: "TCP", desc: "Count of packets with URG set." },
  { name: "Down/Up Ratio", group: "Ratio", desc: "Backward to forward byte ratio." },
  { name: "Average Packet Size", group: "Size", desc: "Mean packet length across the flow." },
  { name: "Init Win Bytes Fwd", group: "TCP", desc: "Initial forward TCP window size." },
  { name: "Init Win Bytes Bwd", group: "TCP", desc: "Initial backward TCP window size." },
  { name: "Active Mean", group: "Temporal", desc: "Mean time the flow was active before idle." },
  { name: "Idle Mean", group: "Temporal", desc: "Mean idle time between flow bursts." },
  { name: "Subflow Fwd Bytes", group: "Volume", desc: "Bytes in the forward subflow." },
  { name: "Fwd Header Length", group: "Size", desc: "Total forward header bytes." },
  { name: "Packet Length Variance", group: "Size", desc: "Variance of packet lengths — a strong DDoS cue." },
  { name: "Fwd Packets/s", group: "Rate", desc: "Forward packet rate." },
  { name: "Bwd Packets/s", group: "Rate", desc: "Backward packet rate." },
] as const;

export const MODEL_METRICS = [
  { name: "Accuracy", value: 99.14, note: "Hold-out CIC flow split" },
  { name: "Precision", value: 98.72, note: "Macro across 8 classes" },
  { name: "Recall", value: 97.91, note: "Macro across 8 classes" },
  { name: "F1 Score", value: 98.28, note: "Harmonic mean" },
  { name: "ROC-AUC", value: 99.46, note: "One-vs-rest" },
  { name: "Log Loss", value: 0.041, note: "Calibrated probabilities" },
];

export const FEATURE_IMPORTANCE = [
  { name: "Flow Bytes/s", value: 0.148 },
  { name: "Fwd Packet Length Mean", value: 0.121 },
  { name: "Flow IAT Std", value: 0.109 },
  { name: "Init Win Bytes Fwd", value: 0.094 },
  { name: "Packet Length Variance", value: 0.087 },
  { name: "SYN Flag Count", value: 0.076 },
  { name: "Bwd Packet Length Mean", value: 0.071 },
  { name: "Flow Duration", value: 0.064 },
  { name: "Fwd Packets/s", value: 0.058 },
  { name: "Idle Mean", value: 0.052 },
];

export const CLASS_DISTRIBUTION: { name: AttackClass; count: number; pct: number }[] = [
  { name: "BENIGN", count: 184220, pct: 61.4 },
  { name: "DDoS", count: 41880, pct: 14.0 },
  { name: "DoS", count: 27610, pct: 9.2 },
  { name: "PortScan", count: 19840, pct: 6.6 },
  { name: "Bot", count: 11290, pct: 3.8 },
  { name: "FTP-Patator", count: 7930, pct: 2.6 },
  { name: "SSH-Patator", count: 4810, pct: 1.6 },
  { name: "Web Attack", count: 2420, pct: 0.8 },
];

export const WAREHOUSE_STATS: WarehouseStat[] = [
  { label: "Flows stored", value: "2.41M", hint: "Star-schema fact table" },
  { label: "Feature columns", value: "78", hint: "CIC flow extractor" },
  { label: "Attack classes", value: "8", hint: "Including BENIGN" },
  { label: "Refresh window", value: "30s", hint: "Streaming micro-batch" },
  { label: "Indexed keys", value: "12", hint: "IP, port, protocol, time" },
  { label: "Model version", value: "CS-4.2", hint: "Gradient boosting + RF stack" },
];

const SAMPLE: Omit<FlowRecord, "id" | "timestamp">[] = [
  { src: "172.16.0.1", dst: "192.168.10.50", srcPort: 443, dstPort: 51244, protocol: "TCP", durationMs: 18420, fwdPackets: 42, bwdPackets: 38, bytesPerSec: 12640, packetsPerSec: 4.3, avgPktLen: 612, flags: "PA", label: "BENIGN", risk: "LOW", confidence: 99.2 },
  { src: "172.16.0.8", dst: "192.168.10.50", srcPort: 80, dstPort: 49122, protocol: "TCP", durationMs: 210, fwdPackets: 18440, bwdPackets: 12, bytesPerSec: 940120, packetsPerSec: 88100, avgPktLen: 60, flags: "S", label: "DDoS", risk: "HIGH", confidence: 87.0 },
  { src: "192.168.10.16", dst: "192.168.10.50", srcPort: 45521, dstPort: 22, protocol: "TCP", durationMs: 8420, fwdPackets: 86, bwdPackets: 74, bytesPerSec: 2104, packetsPerSec: 19.0, avgPktLen: 98, flags: "PA", label: "SSH-Patator", risk: "HIGH", confidence: 91.4 },
  { src: "192.168.10.9", dst: "192.168.10.50", srcPort: 51100, dstPort: 80, protocol: "TCP", durationMs: 90, fwdPackets: 1, bwdPackets: 1, bytesPerSec: 180, packetsPerSec: 22.2, avgPktLen: 54, flags: "S", label: "PortScan", risk: "MEDIUM", confidence: 88.6 },
  { src: "172.16.0.12", dst: "192.168.10.50", srcPort: 21, dstPort: 50110, protocol: "TCP", durationMs: 12400, fwdPackets: 120, bwdPackets: 110, bytesPerSec: 1880, packetsPerSec: 18.5, avgPktLen: 102, flags: "PA", label: "FTP-Patator", risk: "HIGH", confidence: 93.1 },
  { src: "192.168.10.14", dst: "192.168.10.50", srcPort: 443, dstPort: 50881, protocol: "TCP", durationMs: 2400, fwdPackets: 18, bwdPackets: 16, bytesPerSec: 980, packetsPerSec: 14.1, avgPktLen: 540, flags: "PA", label: "Web Attack", risk: "HIGH", confidence: 84.7 },
  { src: "192.168.10.5", dst: "192.168.10.50", srcPort: 443, dstPort: 49912, protocol: "TCP", durationMs: 64000, fwdPackets: 210, bwdPackets: 188, bytesPerSec: 4520, packetsPerSec: 6.2, avgPktLen: 780, flags: "PA", label: "Bot", risk: "MEDIUM", confidence: 79.4 },
  { src: "172.16.0.3", dst: "192.168.10.50", srcPort: 80, dstPort: 51200, protocol: "TCP", durationMs: 340, fwdPackets: 4200, bwdPackets: 8, bytesPerSec: 512400, packetsPerSec: 12400, avgPktLen: 64, flags: "S", label: "DoS", risk: "CRITICAL", confidence: 95.2 },
  { src: "10.0.2.15", dst: "192.168.10.50", srcPort: 443, dstPort: 53110, protocol: "TCP", durationMs: 9200, fwdPackets: 28, bwdPackets: 24, bytesPerSec: 8440, packetsPerSec: 5.6, avgPktLen: 890, flags: "PA", label: "BENIGN", risk: "LOW", confidence: 98.6 },
  { src: "172.16.0.19", dst: "192.168.10.50", srcPort: 8080, dstPort: 41990, protocol: "TCP", durationMs: 180, fwdPackets: 9600, bwdPackets: 4, bytesPerSec: 701200, packetsPerSec: 53300, avgPktLen: 58, flags: "S", label: "DDoS", risk: "HIGH", confidence: 90.8 },
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function makeRecentFlows(now = Date.now(), count = 18): FlowRecord[] {
  const rows: FlowRecord[] = [];
  for (let i = 0; i < count; i++) {
    const s = SAMPLE[i % SAMPLE.length];
    const t = new Date(now - i * 14000 - (i % 3) * 2200);
    rows.push({
      ...s,
      id: `FLW-${(90211 + i).toString(16).toUpperCase()}`,
      timestamp: `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`,
      srcPort: s.srcPort + (i % 7),
      durationMs: s.durationMs + (i % 5) * 40,
    });
  }
  return rows;
}

export const PIPELINE = [
  {
    step: "01",
    title: "Ingest",
    body: "NetFlow / PCAP collectors land raw packets into a streaming buffer. Sessionization rebuilds bidirectional flows.",
  },
  {
    step: "02",
    title: "Warehouse",
    body: "A star schema stores fact_flow with dimensions for host, port, protocol, time and attack label — built for mining, not just storage.",
  },
  {
    step: "03",
    title: "Feature store",
    body: "Seventy-eight CIC-style statistical features are materialised: rates, IAT, flags, window sizes, active/idle bursts.",
  },
  {
    step: "04",
    title: "Mine",
    body: "Unsupervised clustering surfaces new behaviours. Supervised gradient boosting classifies known attack families.",
  },
  {
    step: "05",
    title: "Forecast",
    body: "Calibrated probabilities become an attack-risk score before the session completes — predict, then protect.",
  },
];

export const ARCHITECTURE = [
  { layer: "Sources", items: ["SPAN / TAP", "Zeek logs", "NetFlow v9", "PCAP replay"] },
  { layer: "Warehouse", items: ["fact_flow", "dim_host", "dim_time", "dim_attack"] },
  { layer: "Mining", items: ["K-Means clusters", "Isolation Forest", "Random Forest", "XGBoost stack"] },
  { layer: "Serving", items: ["Risk API", "Dashboard", "Alert bus", "Model registry"] },
];
