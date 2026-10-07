export interface NetNode {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  cx: number;
  cy: number;
  cz: number;
  cluster: number;
  scale: number;
  hub: boolean;
  onAttackPath: boolean;
}

export interface NetEdge {
  a: number;
  b: number;
  onAttackPath: boolean;
  length: number;
}

export interface NetworkData {
  nodes: NetNode[];
  edges: NetEdge[];
  attackPath: number[];
  clusterCenters: { x: number; y: number; z: number }[];
}

export interface ScreenLabel {
  key: string;
  text: string;
  x: number;
  y: number;
  opacity: number;
  accent?: "blue" | "red" | "navy";
}

export interface FrameInfo {
  progress: number;
  labels: ScreenLabel[];
  prediction: number;
  attackIntensity: number;
  analysis: number;
  shield: number;
  cluster: number;
  dashboard: number;
  finale: number;
}

export interface CamSample {
  x: number;
  y: number;
  z: number;
  lx: number;
  ly: number;
  lz: number;
  fov: number;
}
