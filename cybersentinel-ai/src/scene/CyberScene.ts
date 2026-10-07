import * as THREE from "three";
import { clamp, inverseLerp, lerp, smoothstep, band } from "./math";
import {
  FEATURE_LABELS,
  CLUSTER_META,
  generateNetwork,
  pickLabelNodes,
} from "./network";
import { coreFragment, coreVertex, shieldFragment, shieldVertex } from "./shaders";
import type { FrameInfo, NetNode, NetworkData, ScreenLabel } from "./types";

const BG = 0xf4f6f9;
const CORE = new THREE.Vector3(0, 1.15, -38);

interface CamKey {
  t: number;
  x: number;
  y: number;
  z: number;
  lx: number;
  ly: number;
  lz: number;
  fov: number;
}

const CAM_KEYS: CamKey[] = [
  { t: 0.0, x: -16.5, y: 8.4, z: 50, lx: 5.5, ly: 0.35, lz: -1.5, fov: 40 },
  { t: 0.08, x: -9.5, y: 6.1, z: 31, lx: 3.2, ly: 0.25, lz: -6, fov: 40 },
  { t: 0.16, x: -3.4, y: 3.15, z: 14.5, lx: 1.1, ly: 0.35, lz: -10, fov: 46 },
  { t: 0.24, x: 3.8, y: 2.05, z: 2.2, lx: -1.2, ly: 0.2, lz: -14.5, fov: 50 },
  { t: 0.32, x: -2.8, y: 2.45, z: -10.5, lx: 5.4, ly: 0.55, lz: -22, fov: 48 },
  { t: 0.4, x: 13.5, y: 5.6, z: -21, lx: 0.2, ly: 1.15, lz: -37, fov: 40 },
  { t: 0.58, x: 0.0, y: 2.35, z: -25.5, lx: 0, ly: 1.15, lz: -38, fov: 30 },
  { t: 0.66, x: 0.4, y: 20.5, z: 27, lx: 0, ly: 0.1, lz: -5, fov: 38 },
  { t: 0.76, x: 18.5, y: 27, z: 17.5, lx: 0, ly: 0, lz: -4, fov: 40 },
  { t: 0.86, x: 0.2, y: 11.2, z: 19, lx: 0, ly: 0, lz: -2, fov: 36 },
  { t: 0.93, x: 0.0, y: 6.6, z: 35, lx: 0, ly: 0.25, lz: 0, fov: 40 },
  { t: 1.0, x: -9.5, y: 7.6, z: 47, lx: 4.2, ly: 0.4, lz: -1, fov: 42 },
];

interface Packet {
  edge: number;
  t: number;
  speed: number;
  alert: boolean;
}

function createDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function smootherLocal(t: number) {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function sampleCamera(progress: number, time: number) {
  const p = clamp(progress);
  let i = 0;
  while (i < CAM_KEYS.length - 2 && CAM_KEYS[i + 1].t < p) i += 1;
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[i + 1];
  const u = smootherLocal(inverseLerp(a.t, b.t, p));
  let x = lerp(a.x, b.x, u);
  let y = lerp(a.y, b.y, u);
  let z = lerp(a.z, b.z, u);
  let lx = lerp(a.lx, b.lx, u);
  let ly = lerp(a.ly, b.ly, u);
  let lz = lerp(a.lz, b.lz, u);
  let fov = lerp(a.fov, b.fov, u);

  const orbitBlend = band(p, 0.4, 0.445, 0.535, 0.585);
  if (orbitBlend > 0) {
    const ot = inverseLerp(0.4, 0.585, p);
    const angle = ot * Math.PI * 2.05 + 0.35;
    const radius = lerp(16.5, 10.2, ot);
    const ox = CORE.x + Math.cos(angle) * radius;
    const oy = CORE.y + 3.1 + Math.sin(ot * Math.PI * 2) * 1.35;
    const oz = CORE.z + Math.sin(angle) * radius;
    x = lerp(x, ox, orbitBlend);
    y = lerp(y, oy, orbitBlend);
    z = lerp(z, oz, orbitBlend);
    lx = lerp(lx, CORE.x, orbitBlend);
    ly = lerp(ly, CORE.y, orbitBlend);
    lz = lerp(lz, CORE.z, orbitBlend);
    fov = lerp(fov, 34, orbitBlend);
  }

  const sway =
    (1 - smoothstep(0.0, 0.14, p)) * 0.35 + band(p, 0.94, 0.97, 1, 1.05) * 0.25;
  x += Math.sin(time * 0.18) * sway;
  y += Math.cos(time * 0.14) * sway * 0.35;

  return { x, y, z, lx, ly, lz, fov };
}

export class CyberScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private paused = false;
  private width = 1;
  private height = 1;
  private time = 0;
  targetProgress = 0;
  private progress = 0;

  private network: NetworkData;
  private labelNodeIdx: number[];
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private tmp = new THREE.Vector3();
  private look = new THREE.Vector3();
  private camPos = new THREE.Vector3();

  private nodeMesh: THREE.InstancedMesh;
  private lineGeo: THREE.BufferGeometry;
  private lineSegs: THREE.LineSegments;
  private packets: Packet[] = [];
  private packetMesh: THREE.InstancedMesh;
  private particleGeo: THREE.BufferGeometry;
  private particleSpeeds = new Float32Array(0);
  private networkGroup = new THREE.Group();
  private coreGroup = new THREE.Group();
  private shieldMat: THREE.ShaderMaterial;
  private shieldMesh: THREE.Mesh;
  private shieldWire: THREE.Mesh;
  private coreMat: THREE.ShaderMaterial;
  private coreLight: THREE.PointLight;
  private rings: THREE.Mesh[] = [];
  private scanRing: THREE.Mesh;
  private alertOrb: THREE.Mesh;
  private barMesh: THREE.InstancedMesh;
  private clusterDots: THREE.InstancedMesh;
  private dotTex: THREE.Texture;
  private attackCurve: THREE.CatmullRomCurve3 | null = null;
  private attackTube = new THREE.Mesh();

  private navy = new THREE.Color("#0b1f3a");
  private steel = new THREE.Color("#64748b");
  private blue = new THREE.Color("#2563eb");
  private cyan = new THREE.Color("#22d3ee");
  private red = new THREE.Color("#dc2626");
  private silver = new THREE.Color("#94a3b8");

  constructor(
    canvas: HTMLCanvasElement,
    private opts: {
      mobile: boolean;
      reducedMotion: boolean;
      onFrame?: (info: FrameInfo) => void;
    },
  ) {
    const mobile = opts.mobile;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setClearColor(BG, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.45 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG);
    this.scene.fog = new THREE.Fog(BG, 30, 98);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 220);
    this.camera.position.set(-16.5, 8.4, 50);

    const hemi = new THREE.HemisphereLight(0xd7e7ff, 0xffffff, 0.95);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(18, 28, 16);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xb9d9ff, 0.45);
    fill.position.set(-22, 10, -8);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    rim.position.set(4, 8, -40);
    this.scene.add(rim);

    this.coreLight = new THREE.PointLight(0x3b82f6, 0.2, 46, 1.6);
    this.coreLight.position.copy(CORE);
    this.scene.add(this.coreLight);

    this.dotTex = createDotTexture();

    const nodeCount = mobile ? 96 : 220;
    this.network = generateNetwork(nodeCount, 11);
    this.labelNodeIdx = pickLabelNodes(this.network.nodes, FEATURE_LABELS.length);

    this.scene.add(this.networkGroup);
    this.nodeMesh = this.buildNodes();
    const lines = this.buildLines();
    this.lineGeo = lines.geo;
    this.lineSegs = lines.mesh;
    this.packetMesh = this.buildPackets(mobile ? 22 : 58);
    this.particleGeo = this.buildParticles(mobile ? 220 : 560);
    this.coreMat = this.makeCoreMat();
    this.buildCore();
    const shield = this.buildShield();
    this.shieldMat = shield.mat;
    this.shieldMesh = shield.mesh;
    this.shieldWire = shield.wire;
    this.buildAttackPath();
    this.barMesh = this.buildFeatureBars();
    this.clusterDots = this.buildClusterHalos();

    this.alertOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0xdc2626,
        emissiveIntensity: 0.9,
        metalness: 0.2,
        roughness: 0.22,
        transparent: true,
        opacity: 0,
      }),
    );
    this.networkGroup.add(this.alertOrb);

    this.scanRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.035, 12, 80),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.scanRing.rotation.x = Math.PI / 2;
    this.coreGroup.add(this.scanRing);

    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private makeCoreMat() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uAlert: { value: 0 },
        uCool: { value: new THREE.Color("#1e3a8a") },
        uHot: { value: new THREE.Color("#be123c") },
      },
      vertexShader: coreVertex,
      fragmentShader: coreFragment,
      transparent: true,
      toneMapped: false,
      glslVersion: THREE.GLSL1,
    });
  }

  private buildNodes() {
    const geo = new THREE.IcosahedronGeometry(0.16, 1);
    const mat = new THREE.MeshStandardMaterial({
      metalness: 0.72,
      roughness: 0.26,
      emissive: new THREE.Color("#0a2a55"),
      emissiveIntensity: 0.22,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, this.network.nodes.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const n = this.network.nodes.length;
    for (let i = 0; i < n; i++) {
      const node = this.network.nodes[i];
      this.dummy.position.set(node.x, node.y, node.z);
      this.dummy.scale.setScalar(node.scale);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
      this.color.copy(node.hub ? this.blue : this.navy);
      this.color.lerp(this.steel, node.hub ? 0.05 : 0.28);
      mesh.setColorAt(i, this.color);
    }
    mesh.instanceColor!.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
    this.networkGroup.add(mesh);
    return mesh;
  }

  private buildLines() {
    const { edges, nodes } = this.network;
    const pos = new Float32Array(edges.length * 6);
    const col = new Float32Array(edges.length * 6);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = nodes[e.a];
      const b = nodes[e.b];
      const o = i * 6;
      pos[o] = a.x;
      pos[o + 1] = a.y;
      pos[o + 2] = a.z;
      pos[o + 3] = b.x;
      pos[o + 4] = b.y;
      pos[o + 5] = b.z;
      const c = e.onAttackPath ? this.red : this.blue;
      col[o] = c.r;
      col[o + 1] = c.g;
      col[o + 2] = c.b;
      col[o + 3] = c.r;
      col[o + 4] = c.g;
      col[o + 5] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const mesh = new THREE.LineSegments(geo, mat);
    this.networkGroup.add(mesh);
    return { geo, mesh };
  }

  private buildPackets(count: number) {
    const { edges } = this.network;
    for (let i = 0; i < count; i++) {
      const edge = Math.floor(Math.random() * edges.length);
      this.packets.push({
        edge,
        t: Math.random(),
        speed: 0.18 + Math.random() * 0.42,
        alert: edges[edge].onAttackPath,
      });
    }
    const geo = new THREE.SphereGeometry(0.07, 10, 10);
    const mat = new THREE.MeshStandardMaterial({
      metalness: 0.4,
      roughness: 0.3,
      emissive: new THREE.Color("#0284c7"),
      emissiveIntensity: 0.55,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.networkGroup.add(mesh);
    return mesh;
  }

  private buildParticles(count: number) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    this.particleSpeeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      this.particleSpeeds[i] = 0.15 + Math.random() * 0.45;
      const c = Math.random() > 0.82 ? this.cyan : this.silver;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: this.dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.scene.add(new THREE.Points(geo, mat));
    return geo;
  }

  private buildCore() {
    this.coreGroup.position.copy(CORE);
    this.scene.add(this.coreGroup);
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), this.coreMat);
    this.coreGroup.add(inner);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.05, 1),
      new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        metalness: 0.18,
        roughness: 0.12,
        transparent: true,
        opacity: 0.38,
      }),
    );
    this.coreGroup.add(shell);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.15, 1),
      new THREE.MeshBasicMaterial({
        color: 0x1d4ed8,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      }),
    );
    this.coreGroup.add(wire);

    const ringGeo = new THREE.TorusGeometry(2.55, 0.03, 10, 80);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: i === 2 ? 0x0ea5e9 : 0x1d4ed8,
          transparent: true,
          opacity: 0.55,
        }),
      );
      ring.rotation.set(0.4 + i * 0.7, 0.2 + i * 0.5, i * 1.1);
      this.rings.push(ring);
      this.coreGroup.add(ring);
    }
  }

  private buildShield() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uHit: { value: 0 },
        uScan: { value: 0 },
        uColor: { value: new THREE.Color("#3b82f6") },
        uRed: { value: new THREE.Color("#ef4444") },
      },
      vertexShader: shieldVertex,
      fragmentShader: shieldFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      glslVersion: THREE.GLSL1,
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(17.5, 3), mat);
    mesh.scale.setScalar(0.001);
    this.scene.add(mesh);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(17.7, 2),
      new THREE.MeshBasicMaterial({
        color: 0x2563eb,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.scene.add(wire);
    return { mat, mesh, wire };
  }

  private buildAttackPath() {
    const pts = this.network.attackPath.map((i) => {
      const n = this.network.nodes[i];
      return new THREE.Vector3(n.x, n.y, n.z);
    });
    if (pts.length < 2) return;
    this.attackCurve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(this.attackCurve, 64, 0.055, 8, false);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.attackTube = new THREE.Mesh(geo, mat);
    this.networkGroup.add(this.attackTube);
  }

  private buildFeatureBars() {
    const count = 78;
    const geo = new THREE.BoxGeometry(0.12, 1, 0.12);
    const mat = new THREE.MeshStandardMaterial({
      metalness: 0.5,
      roughness: 0.28,
      color: 0x1d4ed8,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.coreGroup.add(mesh);
    return mesh;
  }

  private buildClusterHalos() {
    const geo = new THREE.RingGeometry(3.1, 3.22, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, CLUSTER_META.length);
    for (let i = 0; i < CLUSTER_META.length; i++) {
      const c = this.network.clusterCenters[i];
      this.dummy.position.set(c.x, c.y, c.z);
      this.dummy.scale.setScalar(1);
      this.dummy.rotation.set(-Math.PI / 2.4, 0, 0);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
      this.color.set(CLUSTER_META[i].color);
      mesh.setColorAt(i, this.color);
    }
    mesh.instanceColor!.needsUpdate = true;
    this.scene.add(mesh);
    return mesh;
  }

  setProgress(t: number) {
    this.targetProgress = clamp(t);
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  start() {
    this.clock.start();
    this.tick();
  }

  private onVisibility = () => {
    this.paused = document.hidden;
    if (!this.paused) this.clock.getDelta();
  };

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    if (this.paused) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const k = 1 - Math.exp(-dt * 4.2);
    this.progress += (this.targetProgress - this.progress) * k;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.opts.onFrame?.(this.collectFrameInfo());
  };

  private nodePos(node: NetNode, cluster: number, flat: number) {
    const x = lerp(node.ox, node.cx, cluster);
    const y = lerp(node.oy, node.cy, cluster);
    const z = lerp(node.oz, node.cz, cluster);
    return {
      x: lerp(x, x * 0.82, flat),
      y: lerp(y, y * 0.12, flat),
      z: lerp(z, z * 0.55, flat),
    };
  }

  private update(dt: number) {
    const p = this.opts.reducedMotion ? 0.02 : this.progress;
    const enter = smoothstep(0.08, 0.22, p);
    const anomaly = smoothstep(0.26, 0.38, p);
    const analysis = band(p, 0.38, 0.44, 0.6, 0.68);
    const push = smoothstep(0.54, 0.64, p);
    const shield = smoothstep(0.64, 0.74, p);
    const hit = band(p, 0.68, 0.705, 0.73, 0.8);
    const calm = smoothstep(0.72, 0.8, p);
    const cluster = smoothstep(0.74, 0.84, p);
    const flat = smoothstep(0.84, 0.93, p);
    const finale = smoothstep(0.92, 0.98, p);
    const attackAmt = anomaly * (1 - calm);

    const cam = sampleCamera(p, this.time);
    this.camPos.set(cam.x, cam.y, cam.z);
    this.look.set(cam.lx, cam.ly, cam.lz);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.look);
    if (Math.abs(this.camera.fov - cam.fov) > 0.05) {
      this.camera.fov = cam.fov;
      this.camera.updateProjectionMatrix();
    }

    const fog = this.scene.fog as THREE.Fog;
    fog.near = lerp(32, 10, enter);
    fog.far = lerp(100, 58, enter);

    const rotKeep = band(p, 0, 0, 0.05, 0.13) + band(p, 0.93, 0.96, 1, 1.05);
    this.networkGroup.rotation.y = Math.sin(this.time * 0.11) * 0.22 * rotKeep;

    const breathe = 1 + Math.sin(this.time * 0.5) * 0.02 * (1 - cluster * 0.7);
    const nodes = this.network.nodes;
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      const pos = this.nodePos(node, cluster, flat);
      const alert = node.onAttackPath ? attackAmt : 0;
      this.dummy.position.set(pos.x, pos.y, pos.z);
      this.dummy.scale.setScalar(node.scale * breathe * lerp(1, 0.42, flat));
      this.dummy.rotation.set(0, this.time * (node.hub ? 0.25 : 0.08), 0);
      this.dummy.updateMatrix();
      this.nodeMesh.setMatrixAt(i, this.dummy.matrix);
      if (cluster > 0.02) {
        this.color.set(CLUSTER_META[node.cluster].color);
        this.color.lerp(this.navy, 0.25);
      } else {
        this.color.copy(node.hub ? this.blue : this.navy);
        this.color.lerp(this.steel, node.hub ? 0.08 : 0.3);
      }
      this.color.lerp(this.red, alert);
      this.nodeMesh.setColorAt(i, this.color);
    }
    this.nodeMesh.instanceMatrix.needsUpdate = true;
    if (this.nodeMesh.instanceColor) this.nodeMesh.instanceColor.needsUpdate = true;

    const linePos = this.lineGeo.getAttribute("position") as THREE.BufferAttribute;
    const lineCol = this.lineGeo.getAttribute("color") as THREE.BufferAttribute;
    const edges = this.network.edges;
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = this.nodePos(nodes[e.a], cluster, flat);
      const b = this.nodePos(nodes[e.b], cluster, flat);
      const o = i * 2;
      linePos.setXYZ(o, a.x, a.y, a.z);
      linePos.setXYZ(o + 1, b.x, b.y, b.z);
      const alert = e.onAttackPath ? attackAmt : 0;
      if (cluster > 0.04) {
        this.color.set(CLUSTER_META[nodes[e.a].cluster].color);
      } else {
        this.color.copy(this.blue);
      }
      this.color.lerp(this.red, alert);
      lineCol.setXYZ(o, this.color.r, this.color.g, this.color.b);
      lineCol.setXYZ(o + 1, this.color.r, this.color.g, this.color.b);
    }
    linePos.needsUpdate = true;
    lineCol.needsUpdate = true;
    (this.lineSegs.material as THREE.LineBasicMaterial).opacity =
      lerp(0.22, 0.55, enter) * lerp(1, 0.18, flat) * lerp(1, 0.55, finale) + 0.18;

    const speedMul = lerp(1, 3.4, anomaly) * lerp(1, 0.35, calm) * lerp(1, 1.4, analysis);
    for (let i = 0; i < this.packets.length; i++) {
      const pkt = this.packets[i];
      pkt.t += dt * pkt.speed * speedMul;
      if (pkt.t > 1) pkt.t -= 1;
      const e = edges[pkt.edge];
      const a = this.nodePos(nodes[e.a], cluster, flat);
      const b = this.nodePos(nodes[e.b], cluster, flat);
      this.dummy.position.set(lerp(a.x, b.x, pkt.t), lerp(a.y, b.y, pkt.t), lerp(a.z, b.z, pkt.t));
      const alert = (pkt.alert || e.onAttackPath) && attackAmt > 0.15;
      this.dummy.scale.setScalar(alert ? 1.7 : 1);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.packetMesh.setMatrixAt(i, this.dummy.matrix);
      this.color.copy(alert ? this.red : this.cyan);
      this.packetMesh.setColorAt(i, this.color);
    }
    this.packetMesh.instanceMatrix.needsUpdate = true;
    if (this.packetMesh.instanceColor) this.packetMesh.instanceColor.needsUpdate = true;
    this.packetMesh.visible = flat < 0.85;

    const pPos = this.particleGeo.getAttribute("position") as THREE.BufferAttribute;
    const pCount = pPos.count;
    const pSpeed = lerp(1, 2.2, anomaly);
    for (let i = 0; i < pCount; i++) {
      let y = pPos.getY(i) + dt * this.particleSpeeds[i] * 0.8 * pSpeed;
      if (y > 22) y = -22;
      pPos.setY(i, y);
    }
    pPos.needsUpdate = true;

    this.coreGroup.visible = p > 0.28 || this.opts.reducedMotion;
    const coreScale = lerp(0.15, 1, smoothstep(0.32, 0.46, p)) * lerp(1, 0.35, flat);
    this.coreGroup.scale.setScalar(Math.max(coreScale, 0.001));
    this.coreGroup.rotation.y = this.time * 0.18 + analysis * this.time * 0.2;
    this.rings.forEach((ring, i) => {
      ring.rotation.x += dt * (0.25 + i * 0.12) * (1 + analysis * 1.6);
      ring.rotation.y += dt * (0.18 + i * 0.08);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.25 + analysis * 0.5;
    });
    this.coreMat.uniforms.uTime.value = this.time;
    this.coreMat.uniforms.uEnergy.value = analysis;
    this.coreMat.uniforms.uAlert.value = attackAmt * 0.7 + push * 0.35;
    this.coreLight.intensity = 0.15 + analysis * 2.4 + push * 1.2;
    this.coreLight.color.copy(this.blue).lerp(this.red, attackAmt * 0.5);

    const scanMat = this.scanRing.material as THREE.MeshBasicMaterial;
    scanMat.opacity = analysis * 0.75;
    this.scanRing.position.y = Math.sin(this.time * 1.4) * 1.6;
    this.scanRing.scale.setScalar(1 + analysis * 0.25 + Math.sin(this.time * 2) * 0.05);

    const barMat = this.barMesh.material as THREE.MeshStandardMaterial;
    barMat.opacity = analysis * 0.85 * (1 - shield * 0.7);
    const barVis = analysis * (1 - flat);
    for (let i = 0; i < 78; i++) {
      const ang = (i / 78) * Math.PI * 2;
      const rad = 4.4 + (i % 5) * 0.18;
      const h = (0.35 + 0.75 * Math.abs(Math.sin(this.time * 1.3 + i * 0.4))) * barVis;
      this.dummy.position.set(Math.cos(ang) * rad, h * 0.5 - 0.2, Math.sin(ang) * rad);
      this.dummy.scale.set(1, Math.max(h, 0.02), 1);
      this.dummy.rotation.set(0, -ang, 0);
      this.dummy.updateMatrix();
      this.barMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.barMesh.instanceMatrix.needsUpdate = true;
    this.barMesh.visible = barVis > 0.02;

    if (this.attackCurve) {
      const tubeMat = this.attackTube.material as THREE.MeshBasicMaterial;
      tubeMat.opacity = attackAmt * 0.85;
      this.attackTube.visible = attackAmt > 0.02;
      const headT = clamp(smoothstep(0.26, 0.42, p) + ((this.time * 0.03) % 0.08));
      this.alertOrb.position.copy(this.attackCurve.getPoint(headT));
      const orbMat = this.alertOrb.material as THREE.MeshStandardMaterial;
      orbMat.opacity = attackAmt;
      this.alertOrb.scale.setScalar(1 + Math.sin(this.time * 6) * 0.18);
    }

    const shieldAmt = shield * (1 - cluster * 0.85) * (1 - finale * 0.4);
    this.shieldMat.uniforms.uTime.value = this.time;
    this.shieldMat.uniforms.uOpacity.value = shieldAmt;
    this.shieldMat.uniforms.uHit.value = hit;
    this.shieldMat.uniforms.uScan.value = shieldAmt;
    const s = Math.max(0.001, shieldAmt * (1.02 + hit * 0.06));
    this.shieldMesh.scale.setScalar(s);
    this.shieldWire.scale.setScalar(s * 1.01);
    (this.shieldWire.material as THREE.MeshBasicMaterial).opacity = shieldAmt * 0.22;
    this.shieldWire.rotation.y = this.time * 0.08;

    const halo = cluster * (1 - flat);
    (this.clusterDots.material as THREE.MeshBasicMaterial).opacity = halo * 0.7;
    for (let i = 0; i < CLUSTER_META.length; i++) {
      const c = this.network.clusterCenters[i];
      this.dummy.position.set(c.x, c.y, lerp(c.z, c.z * 0.55, flat));
      this.dummy.scale.setScalar(0.7 + halo * 0.45 + Math.sin(this.time * 0.8 + i) * 0.05);
      this.dummy.rotation.set(-Math.PI / 2.3, 0, this.time * 0.05);
      this.dummy.updateMatrix();
      this.clusterDots.setMatrixAt(i, this.dummy.matrix);
    }
    this.clusterDots.instanceMatrix.needsUpdate = true;
  }

  private collectFrameInfo(): FrameInfo {
    const p = this.opts.reducedMotion ? this.targetProgress : this.progress;
    const labels: ScreenLabel[] = [];
    const enter = band(p, 0.12, 0.17, 0.24, 0.32);
    const w = this.width;
    const h = this.height;

    if (enter > 0.02) {
      for (let i = 0; i < FEATURE_LABELS.length; i++) {
        const node = this.network.nodes[this.labelNodeIdx[i] % this.network.nodes.length];
        const pos = this.nodePos(node, 0, 0);
        this.tmp.set(pos.x, pos.y, pos.z).project(this.camera);
        const x = (this.tmp.x * 0.5 + 0.5) * w;
        const y = (-this.tmp.y * 0.5 + 0.5) * h;
        const vis = this.tmp.z > -1 && this.tmp.z < 1 && this.tmp.x > -1.05 && this.tmp.x < 1.05;
        labels.push({
          key: `f-${i}`,
          text: FEATURE_LABELS[i],
          x,
          y,
          opacity: vis ? enter : 0,
          accent: "blue",
        });
      }
    }

    const cluster = band(p, 0.74, 0.8, 0.88, 0.93);
    if (cluster > 0.02) {
      for (let i = 0; i < CLUSTER_META.length; i++) {
        const c = this.network.clusterCenters[i];
        this.tmp.set(c.x, c.y + 1.4, c.z).project(this.camera);
        const x = (this.tmp.x * 0.5 + 0.5) * w;
        const y = (-this.tmp.y * 0.5 + 0.5) * h;
        const vis = this.tmp.z > -1 && this.tmp.z < 1 && Math.abs(this.tmp.x) < 1.1;
        labels.push({
          key: `c-${i}`,
          text: CLUSTER_META[i].name,
          x,
          y,
          opacity: vis ? cluster : 0,
          accent: i === 0 ? "blue" : "red",
        });
      }
    }

    const keys = [0, 42, 61, 74, 87];
    const tp = inverseLerp(0.52, 0.63, p);
    const x = tp * (keys.length - 1);
    const ia = Math.min(keys.length - 2, Math.floor(x));
    const f = x - ia;
    const prediction = Math.round(lerp(keys[ia], keys[ia + 1], smootherLocal(f)));

    return {
      progress: p,
      labels,
      prediction,
      attackIntensity: smoothstep(0.26, 0.38, p) * (1 - smoothstep(0.72, 0.8, p)),
      analysis: band(p, 0.38, 0.44, 0.6, 0.68),
      shield: smoothstep(0.64, 0.74, p),
      cluster: smoothstep(0.74, 0.84, p),
      dashboard: band(p, 0.84, 0.88, 0.92, 0.96),
      finale: smoothstep(0.93, 0.98, p),
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    this.dotTex.dispose();
    this.renderer.dispose();
  }
}
