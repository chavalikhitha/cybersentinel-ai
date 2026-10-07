export const shieldVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec3 vObj;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vObj = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const shieldFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uHit;
  uniform float uScan;
  uniform vec3 uColor;
  uniform vec3 uRed;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec3 vObj;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float ndv = abs(dot(n, v));
    float fresnel = pow(1.0 - ndv, 2.4);

    vec3 p = vObj * 0.42;
    float hex = abs(sin(p.x * 7.0 + uTime * 0.15) * sin(p.y * 7.0) * sin(p.z * 7.0));
    float grid = 1.0 - smoothstep(0.0, 0.18, hex);

    float ripple = sin(length(vObj) * 2.4 - uTime * 3.0) * 0.5 + 0.5;
    ripple = pow(ripple, 3.0) * uHit;

    float scan = smoothstep(0.12, 0.0, abs(vObj.y - (uScan * 2.0 - 1.0) * 18.0));
    vec3 col = mix(uColor, uRed, uHit * 0.55 + ripple * 0.35);
    float alpha = (fresnel * 0.82 + grid * 0.14 + scan * 0.12 * uScan + 0.03) * uOpacity;
    alpha += (ripple + uHit * fresnel) * 0.4;
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(col, alpha);
  }
`;

export const coreVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vObj;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    vObj = position;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const coreFragment = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uAlert;
  uniform vec3 uCool;
  uniform vec3 uHot;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vObj;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float fresnel = pow(1.0 - abs(dot(n, v)), 1.8);
    float pulse = 0.5 + 0.5 * sin(uTime * 2.2 + vObj.y * 4.0);
    float bands = 0.5 + 0.5 * sin(vObj.y * 14.0 + uTime * 3.0);
    vec3 col = mix(uCool, uHot, uAlert);
    col += fresnel * 0.55;
    col += bands * 0.08 * uEnergy;
    float alpha = 0.72 + fresnel * 0.28 + pulse * 0.08;
    gl_FragColor = vec4(col, alpha);
  }
`;
