import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { soundManager } from '../../utils/audio';

export type Destination = 'MOON' | 'MARS';

export type SolarBodyId =
  | 'SUN'
  | 'MERCURY'
  | 'VENUS'
  | 'EARTH'
  | 'MOON'
  | 'MARS'
  | 'JUPITER'
  | 'SATURN'
  | 'URANUS'
  | 'NEPTUNE';

export interface SolarBodyInfo {
  id: SolarBodyId;
  name: string;
  subtitle: string;
  size: string;
  moons: string;
  temperature: string;
  funFact: string;
  isLandable: boolean;
  destination?: Destination;
  distanceFromEarth?: string;
  flightTime?: string;
  hazards?: string;
  orbitRadius: number;
  radius: number;
  orbitSpeed: number;
  initialAngle: number;
  accentColor: string;
  emissiveColor: string;
  hasRings?: boolean;
}

export const SOLAR_SYSTEM_BODIES: Record<SolarBodyId, SolarBodyInfo> = {
  SUN: {
    id: 'SUN',
    name: 'THE SUN (SOL)',
    subtitle: 'G-Type Main-Sequence Yellow Dwarf Star',
    size: '1,392,700 km (109× Earth)',
    moons: '8 Planets • 5 Dwarf Planets',
    temperature: '+5,500°C Surface / 15M°C Core',
    funFact:
      'Contains 99.86% of all mass in the Solar System and unleashes the Coronal Mass Ejections (CMEs) tracked by NASA DONKI.',
    isLandable: false,
    orbitRadius: 0,
    radius: 9.5,
    orbitSpeed: 0,
    initialAngle: 0,
    accentColor: '#f59e0b',
    emissiveColor: '#ea580c',
  },
  MERCURY: {
    id: 'MERCURY',
    name: 'MERCURY',
    subtitle: '1st Planet • Airless Cratered Iron World',
    size: '4,879 km (0.38× Earth)',
    moons: '0 Moons',
    temperature: '-180°C to +430°C',
    funFact:
      'A solar day on Mercury (sunrise to sunrise) lasts 176 Earth days — twice as long as its entire 88-day orbital year!',
    isLandable: false,
    orbitRadius: 21,
    radius: 1.45,
    orbitSpeed: 0.52,
    initialAngle: 0.8,
    accentColor: '#94a3b8',
    emissiveColor: '#64748b',
  },
  VENUS: {
    id: 'VENUS',
    name: 'VENUS',
    subtitle: '2nd Planet • Super-Greenhouse Cloud World',
    size: '12,104 km (0.95× Earth)',
    moons: '0 Moons',
    temperature: '+465°C (Hottest Planet)',
    funFact:
      'Venus spins backward (retrograde rotation) under a crushing CO₂ atmosphere with 92× Earth surface pressure.',
    isLandable: false,
    orbitRadius: 32,
    radius: 2.25,
    orbitSpeed: 0.36,
    initialAngle: 2.3,
    accentColor: '#fbbf24',
    emissiveColor: '#d97706',
  },
  EARTH: {
    id: 'EARTH',
    name: 'EARTH',
    subtitle: '3rd Planet • Home Blue Marble & Launch Origin',
    size: '12,742 km (1.00× Earth)',
    moons: '1 Moon (Luna)',
    temperature: '-89°C to +57°C (Avg +15°C)',
    funFact:
      'The only known world with liquid surface oceans and a dipolar magnetosphere shielding crew from solar radiation.',
    isLandable: false,
    orbitRadius: 46,
    radius: 2.65,
    orbitSpeed: 0.24,
    initialAngle: -0.6,
    accentColor: '#38bdf8',
    emissiveColor: '#0284c7',
  },
  MOON: {
    id: 'MOON',
    name: 'THE MOON (LUNA)',
    subtitle: 'TARGET: Lunar South Pole (Artemis Base)',
    size: '3,474 km (0.27× Earth)',
    moons: '0 (Orbits Earth)',
    temperature: '-230°C (Shadowed Craters) to +120°C',
    funFact:
      'Permanently shadowed craters at the Lunar South Pole hold ancient water-ice billions of years old — vital for Artemis ISRU!',
    isLandable: true,
    destination: 'MOON',
    distanceFromEarth: '384,400 km',
    flightTime: '3 Days',
    hazards: 'Extreme Cold (-230°C), Electrostatic Lunar Regolith Dust',
    orbitRadius: 6.4, // relative to Earth
    radius: 1.05,
    orbitSpeed: 1.35,
    initialAngle: 1.1,
    accentColor: '#22d3ee',
    emissiveColor: '#06b6d4',
  },
  MARS: {
    id: 'MARS',
    name: 'MARS',
    subtitle: 'TARGET: Olympus Mons Outpost (4th Planet)',
    size: '6,779 km (0.53× Earth)',
    moons: '2 Moons (Phobos & Deimos)',
    temperature: '-140°C to +20°C (Avg -63°C)',
    funFact:
      'Home to Olympus Mons, the tallest volcano in the Solar System — standing 21.9 km high, nearly 3× Mount Everest!',
    isLandable: true,
    destination: 'MARS',
    distanceFromEarth: '225,000,000 km',
    flightTime: '7 Months',
    hazards: 'Solar Radiation (DONKI), Global Dust Storms, 22-min Comms Delay',
    orbitRadius: 63,
    radius: 2.05,
    orbitSpeed: 0.17,
    initialAngle: -1.35,
    accentColor: '#f97316',
    emissiveColor: '#ea580c',
  },
  JUPITER: {
    id: 'JUPITER',
    name: 'JUPITER',
    subtitle: '5th Planet • King of the Gas Giants',
    size: '139,820 km (11.2× Earth)',
    moons: '95 Moons (Io, Europa, Ganymede, Callisto)',
    temperature: '-110°C (Upper Cloud Deck)',
    funFact:
      'Jupiter’s Great Red Spot is a colossal anticyclonic storm larger than Earth that has raged for over 300 years!',
    isLandable: false,
    orbitRadius: 92,
    radius: 5.6,
    orbitSpeed: 0.095,
    initialAngle: 0.35,
    accentColor: '#fdba74',
    emissiveColor: '#c2410c',
  },
  SATURN: {
    id: 'SATURN',
    name: 'SATURN',
    subtitle: '6th Planet • Ringed Gas Giant Jewel',
    size: '116,460 km (9.45× Earth)',
    moons: '146 Moons (Titan & Enceladus)',
    temperature: '-140°C (Upper Cloud Deck)',
    funFact:
      'Saturn’s iconic rings span 282,000 km across yet average only 10 meters thick, composed of 99% pure water-ice!',
    isLandable: false,
    orbitRadius: 122,
    radius: 4.7,
    orbitSpeed: 0.068,
    initialAngle: 2.05,
    accentColor: '#fde047',
    emissiveColor: '#ca8a04',
    hasRings: true,
  },
  URANUS: {
    id: 'URANUS',
    name: 'URANUS',
    subtitle: '7th Planet • Tilted Cyan Ice Giant',
    size: '50,724 km (4.0× Earth)',
    moons: '28 Moons (Titania, Oberon, Miranda)',
    temperature: '-195°C (Coldest Atmosphere)',
    funFact:
      'Uranus rotates on its side with an axial tilt of 97.8°, rolling around the Sun like a giant aquamarine sphere!',
    isLandable: false,
    orbitRadius: 150,
    radius: 3.3,
    orbitSpeed: 0.046,
    initialAngle: -2.4,
    accentColor: '#67e8f9',
    emissiveColor: '#0891b2',
  },
  NEPTUNE: {
    id: 'NEPTUNE',
    name: 'NEPTUNE',
    subtitle: '8th Planet • Supersonic Cobalt Ice Giant',
    size: '49,244 km (3.88× Earth)',
    moons: '16 Moons (Triton)',
    temperature: '-200°C (Outer Frontier)',
    funFact:
      'Whips up the fastest supersonic winds in the Solar System, howling at 2,100 km/h across deep methane clouds!',
    isLandable: false,
    orbitRadius: 176,
    radius: 3.15,
    orbitSpeed: 0.034,
    initialAngle: 3.6,
    accentColor: '#60a5fa',
    emissiveColor: '#2563eb',
  },
};

export const ORDERED_SOLAR_BODIES: SolarBodyId[] = [
  'MERCURY',
  'VENUS',
  'EARTH',
  'MOON',
  'MARS',
  'JUPITER',
  'SATURN',
  'URANUS',
  'NEPTUNE',
];

/**
 * 100% Procedural CanvasTexture generator for the Sun, all 8 planets, and the Moon
 */
function createPlanetCanvasTexture(id: SolarBodyId): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (id === 'SUN') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#fff7ed');
    grad.addColorStop(0.25, '#fbbf24');
    grad.addColorStop(0.5, '#f97316');
    grad.addColorStop(0.75, '#fbbf24');
    grad.addColorStop(1, '#fff7ed');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 220; i++) {
      const x = (i * 73) % 512;
      const y = (i * 41) % 256;
      const r = 4 + (i % 14);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(234,88,12,0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'MERCURY') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 160; i++) {
      const x = (i * 89) % 512;
      const y = (i * 53) % 256;
      const r = 3 + (i % 18);
      ctx.fillStyle = i % 2 === 0 ? '#475569' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (id === 'VENUS') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#d97706');
    grad.addColorStop(0.3, '#fbbf24');
    grad.addColorStop(0.5, '#fde68a');
    grad.addColorStop(0.7, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? 'rgba(254,243,199,0.28)' : 'rgba(180,83,9,0.22)';
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const wy = y + Math.sin(x * 0.03 + y) * 6;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.lineTo(512, y + 10);
      ctx.lineTo(0, y + 10);
      ctx.fill();
    }
  } else if (id === 'EARTH') {
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 256);
    oceanGrad.addColorStop(0, '#0284c7');
    oceanGrad.addColorStop(0.5, '#0369a1');
    oceanGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Continents
    const continents = [
      [95, 85, 58, 42],
      [140, 165, 42, 55],
      [255, 78, 65, 38],
      [275, 145, 48, 52],
      [370, 90, 72, 48],
      [415, 185, 38, 28],
    ];
    continents.forEach(([cx, cy, rx, ry], idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#15803d' : '#16a34a';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.3 * idx, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy - 5, rx * 0.45, ry * 0.4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillRect(0, 238, 512, 18);
  } else if (id === 'MOON') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 256);
    // Dark lunar maria
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.55)';
      ctx.beginPath();
      ctx.arc((i * 97) % 512, (i * 61) % 256, 18 + (i % 25), 0, Math.PI * 2);
      ctx.fill();
    }
    // Impact craters with bright rims
    for (let i = 0; i < 140; i++) {
      const cx = (i * 67) % 512;
      const cy = (i * 43) % 256;
      const r = 3 + (i % 14);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  } else if (id === 'MARS') {
    const marsGrad = ctx.createLinearGradient(0, 0, 0, 256);
    marsGrad.addColorStop(0, '#9a3412');
    marsGrad.addColorStop(0.5, '#c2410c');
    marsGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = marsGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Dark basalt plains & Olympus Mons calderas
    for (let i = 0; i < 90; i++) {
      const cx = (i * 83) % 512;
      const cy = 24 + ((i * 47) % 208);
      const r = 6 + (i % 22);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(67, 20, 7, 0.45)' : 'rgba(251, 146, 60, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar CO2 / water ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 14);
    ctx.fillRect(0, 242, 512, 14);
  } else if (id === 'JUPITER') {
    const bands = [
      '#78350f',
      '#fde68a',
      '#b45309',
      '#fef3c7',
      '#c2410c',
      '#fed7aa',
      '#9a3412',
      '#fde68a',
      '#78350f',
    ];
    const bh = 256 / bands.length;
    bands.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, i * bh, 512, bh + 2);
    });
    // Great Red Spot
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(310, 158, 38, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (id === 'SATURN') {
    const bands = ['#a16207', '#fde047', '#ca8a04', '#fef08a', '#eab308', '#fde68a', '#854d0e'];
    const bh = 256 / bands.length;
    bands.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, i * bh, 512, bh + 2);
    });
  } else if (id === 'URANUS') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#0891b2');
    grad.addColorStop(0.5, '#67e8f9');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
  } else if (id === 'NEPTUNE') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.5, '#2563eb');
    grad.addColorStop(1, '#172554');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    // High-altitude white methane cirrus streaks & Great Dark Spot
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(210, 140, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect((i * 79) % 460, 30 + ((i * 37) % 190), 48, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Procedural concentric ring texture for Saturn's icy rings
 */
function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  for (let r = 48; r < 126; r += 1.5) {
    // Cassini division gap around r = 96..102
    if (r > 95 && r < 102) continue;
    const alpha = r < 62 ? 0.35 : r < 95 ? 0.85 : 0.65;
    ctx.strokeStyle =
      Math.floor(r) % 4 === 0
        ? `rgba(254, 240, 138, ${alpha})`
        : `rgba(217, 119, 6, ${alpha * 0.85})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Soft radial nebula cloud texture
 */
function createNebulaCanvasTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.5, colorHex + '55');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface SpaceOrbitNavProps {
  onHoverPlanet: (planet: Destination | null) => void;
  onSelectPlanet: (planet: Destination) => void;
  onConfirmTrajectory?: () => void;
  selectedDestination: Destination | null;
  hoveredDestination: Destination | null;
  isWarping: boolean;
  warpProgress: number; // 0 to 1
  isReentering: boolean;
}

export const SpaceOrbitNav: React.FC<SpaceOrbitNavProps> = ({
  onHoverPlanet,
  onSelectPlanet,
  selectedDestination,
  isWarping,
  warpProgress,
  isReentering,
}) => {
  const { camera } = useThree();

  // Local state for any hovered or clicked planet (supports all 8 planets + Moon + Sun)
  const [hoveredBody, setHoveredBody] = useState<SolarBodyId | null>(null);
  const [focusedPlanet, setFocusedPlanet] = useState<SolarBodyId | null>(
    selectedDestination || null
  );

  // Sync when parent selectedDestination changes (e.g., from bottom bar buttons)
  useEffect(() => {
    if (selectedDestination) {
      setFocusedPlanet(selectedDestination);
      window.dispatchEvent(
        new CustomEvent('solar-planet-selected', { detail: selectedDestination })
      );
    }
  }, [selectedDestination]);

  // Listen for external focus requests from Overlay HUD buttons
  useEffect(() => {
    const onExternalFocus = (e: Event) => {
      const custom = e as CustomEvent<SolarBodyId | null>;
      setFocusedPlanet(custom.detail);
    };
    window.addEventListener('solar-planet-focus-request', onExternalFocus);
    return () => window.removeEventListener('solar-planet-focus-request', onExternalFocus);
  }, []);

  // Refs for animated solar system bodies
  const sunCoronaRef = useRef<THREE.Mesh>(null);
  const sunOuterHaloRef = useRef<THREE.Mesh>(null);
  const planetGroupRefs = useRef<Partial<Record<SolarBodyId, THREE.Group | null>>>({});
  const planetMeshRefs = useRef<Partial<Record<SolarBodyId, THREE.Mesh | null>>>({});
  const asteroidBeltRef = useRef<THREE.InstancedMesh>(null);
  const rocketGroupRef = useRef<THREE.Group>(null);
  const warpStarsRef = useRef<THREE.LineSegments>(null);
  const starfieldRef = useRef<THREE.Points>(null);

  // Live world positions of every body updated each frame
  const bodyWorldPositions = useRef<Record<SolarBodyId, THREE.Vector3>>({
    SUN: new THREE.Vector3(0, 0, 0),
    MERCURY: new THREE.Vector3(21, 0, 0),
    VENUS: new THREE.Vector3(32, 0, 0),
    EARTH: new THREE.Vector3(46, 0, 0),
    MOON: new THREE.Vector3(52.4, 0, 0),
    MARS: new THREE.Vector3(63, 0, 0),
    JUPITER: new THREE.Vector3(92, 0, 0),
    SATURN: new THREE.Vector3(122, 0, 0),
    URANUS: new THREE.Vector3(150, 0, 0),
    NEPTUNE: new THREE.Vector3(176, 0, 0),
  });

  const smoothLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const desiredCamPosRef = useRef(new THREE.Vector3(0, 48, 115));

  // Procedural CanvasTextures for all bodies
  const bodyTextures = useMemo(() => {
    const map: Record<SolarBodyId, THREE.CanvasTexture> = {
      SUN: createPlanetCanvasTexture('SUN'),
      MERCURY: createPlanetCanvasTexture('MERCURY'),
      VENUS: createPlanetCanvasTexture('VENUS'),
      EARTH: createPlanetCanvasTexture('EARTH'),
      MOON: createPlanetCanvasTexture('MOON'),
      MARS: createPlanetCanvasTexture('MARS'),
      JUPITER: createPlanetCanvasTexture('JUPITER'),
      SATURN: createPlanetCanvasTexture('SATURN'),
      URANUS: createPlanetCanvasTexture('URANUS'),
      NEPTUNE: createPlanetCanvasTexture('NEPTUNE'),
    };
    return map;
  }, []);

  const saturnRingTexture = useMemo(() => createSaturnRingTexture(), []);
  const nebulaTextures = useMemo(
    () => [
      createNebulaCanvasTexture('#7c3aed'),
      createNebulaCanvasTexture('#0891b2'),
      createNebulaCanvasTexture('#db2777'),
      createNebulaCanvasTexture('#4f46e5'),
    ],
    []
  );

  // 2,000 Deep Space Star Particles
  const starfieldGeo = useMemo(() => {
    const COUNT = 2000;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 340 + Math.random() * 140;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const tint = i % 5;
      if (tint === 0) {
        colors[i * 3 + 0] = 0.65;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 1.0;
      } else if (tint === 1) {
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // 120 Instanced Asteroid Belt Rocks between Mars (r=63) and Jupiter (r=92)
  const ASTEROID_COUNT = 120;
  const asteroidData = useMemo(() => {
    return Array.from({ length: ASTEROID_COUNT }).map((_, i) => {
      const angle = (i / ASTEROID_COUNT) * Math.PI * 2 + (i % 7) * 0.08;
      const radius = 74 + ((i * 19) % 12) + Math.sin(i * 1.7) * 1.8;
      const yOffset = Math.sin(i * 2.3) * 2.2;
      const scale = 0.25 + (i % 5) * 0.14;
      return { angle, radius, yOffset, scale };
    });
  }, []);

  useEffect(() => {
    if (!asteroidBeltRef.current) return;
    const dummy = new THREE.Object3D();
    asteroidData.forEach((ast, i) => {
      dummy.position.set(
        Math.cos(ast.angle) * ast.radius,
        ast.yOffset,
        Math.sin(ast.angle) * ast.radius
      );
      dummy.rotation.set(i * 0.5, i * 0.9, i * 0.3);
      dummy.scale.set(ast.scale * 1.3, ast.scale * 0.85, ast.scale);
      dummy.updateMatrix();
      asteroidBeltRef.current!.setMatrixAt(i, dummy.matrix);
    });
    asteroidBeltRef.current.instanceMatrix.needsUpdate = true;
    asteroidBeltRef.current.computeBoundingSphere();
  }, [asteroidData]);

  // Hyperspace warp lines geometry (1,200 streaks)
  const WARP_LINE_COUNT = 1200;
  const warpLinesData = useMemo(() => {
    const positions = new Float32Array(WARP_LINE_COUNT * 6);
    const colors = new Float32Array(WARP_LINE_COUNT * 6);

    for (let i = 0; i < WARP_LINE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.0 + Math.random() * 50;
      const z = -Math.random() * 240;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z - (10 + Math.random() * 35);

      const c = i % 3 === 0 ? [0.2, 0.85, 1.0] : i % 3 === 1 ? [0.7, 0.35, 1.0] : [1.0, 1.0, 1.0];
      colors[i * 6 + 0] = c[0];
      colors[i * 6 + 1] = c[1];
      colors[i * 6 + 2] = c[2];
      colors[i * 6 + 3] = c[0];
      colors[i * 6 + 4] = c[1];
      colors[i * 6 + 5] = c[2];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Mouse drag camera orbit around solar system / focused planet
  const yaw = useRef(0.35);
  const pitch = useRef(0.42);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        prevMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || isWarping) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.0045;
      pitch.current = Math.max(0.08, Math.min(1.15, pitch.current + dy * 0.0035));
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isWarping]);

  useEffect(() => {
    soundManager.playSpaceAmbience();
  }, []);

  const handleHoverBody = (id: SolarBodyId | null) => {
    setHoveredBody(id);
    document.body.style.cursor = id ? 'pointer' : 'default';
    if (id === 'MOON' || id === 'MARS') {
      onHoverPlanet(id);
    } else {
      onHoverPlanet(null);
    }
  };

  const handleClickBody = (id: SolarBodyId) => {
    soundManager.playTelemetryChirp();
    setFocusedPlanet(id);
    window.dispatchEvent(new CustomEvent('solar-planet-selected', { detail: id }));

    // Only call onSelectPlanet for valid landable destinations ('MOON' | 'MARS')
    if (id === 'MOON' || id === 'MARS') {
      onSelectPlanet(id);
    }
  };

  // Frame loop: orbital mechanics for all 8 planets + Moon + Sun corona pulse + camera lerp
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(delta, 0.033);

    // 1. Pulsing Sun Corona Halo
    if (sunCoronaRef.current) {
      const pulse = 1.0 + Math.sin(t * 2.8) * 0.06;
      sunCoronaRef.current.scale.set(pulse, pulse, pulse);
    }
    if (sunOuterHaloRef.current) {
      const pulse2 = 1.0 + Math.cos(t * 1.9) * 0.08;
      sunOuterHaloRef.current.scale.set(pulse2, pulse2, pulse2);
    }

    // 2. Orbit each planet around Sun at [0, 0, 0]
    const planetOrder: SolarBodyId[] = [
      'MERCURY',
      'VENUS',
      'EARTH',
      'MARS',
      'JUPITER',
      'SATURN',
      'URANUS',
      'NEPTUNE',
    ];

    planetOrder.forEach((id) => {
      const info = SOLAR_SYSTEM_BODIES[id];
      const angle = info.initialAngle + t * info.orbitSpeed * 0.35;
      const x = Math.cos(angle) * info.orbitRadius;
      const z = Math.sin(angle) * info.orbitRadius;

      bodyWorldPositions.current[id].set(x, 0, z);
      const grp = planetGroupRefs.current[id];
      if (grp) {
        grp.position.set(x, 0, z);
      }
      const mesh = planetMeshRefs.current[id];
      if (mesh) {
        mesh.rotation.y = t * 0.35;
      }
    });

    // 3. Orbit the Moon around Earth
    const earthPos = bodyWorldPositions.current.EARTH;
    const moonInfo = SOLAR_SYSTEM_BODIES.MOON;
    const moonAngle = moonInfo.initialAngle + t * moonInfo.orbitSpeed * 0.45;
    const moonX = earthPos.x + Math.cos(moonAngle) * moonInfo.orbitRadius;
    const moonY = Math.sin(moonAngle * 0.8) * 0.65;
    const moonZ = earthPos.z + Math.sin(moonAngle) * moonInfo.orbitRadius;
    bodyWorldPositions.current.MOON.set(moonX, moonY, moonZ);

    const moonGrp = planetGroupRefs.current.MOON;
    if (moonGrp) {
      moonGrp.position.set(moonX, moonY, moonZ);
    }
    const moonMesh = planetMeshRefs.current.MOON;
    if (moonMesh) {
      moonMesh.rotation.y = t * 0.25;
    }

    // 4. Slowly rotate the Asteroid Belt between Mars and Jupiter
    if (asteroidBeltRef.current) {
      asteroidBeltRef.current.rotation.y = t * 0.025;
    }

    // 5. Starfield subtle drift
    if (starfieldRef.current) {
      starfieldRef.current.rotation.y = t * 0.002;
    }

    // 6. Position Rocket near Earth in Low Earth Orbit (or flying to destination during Warp)
    if (rocketGroupRef.current) {
      if (isWarping && selectedDestination) {
        const destPos = bodyWorldPositions.current[selectedDestination];
        const flyVec = destPos.clone().sub(rocketGroupRef.current.position).normalize();
        const warpSpeed = 18.0 + warpProgress * 65.0;
        rocketGroupRef.current.position.addScaledVector(flyVec, warpSpeed * dt);

        const camOffset = flyVec.clone().multiplyScalar(-12).add(new THREE.Vector3(0, 4.0, 0));
        desiredCamPosRef.current.copy(rocketGroupRef.current.position).add(camOffset);
        camera.position.lerp(desiredCamPosRef.current, dt * 8.0);
        camera.lookAt(destPos);
      } else {
        // Rocket orbits just beside Earth
        const rocketOrbitAng = t * 0.6;
        const rx = earthPos.x + Math.cos(rocketOrbitAng) * 4.2;
        const ry = 1.6 + Math.sin(t * 1.4) * 0.25;
        const rz = earthPos.z + Math.sin(rocketOrbitAng) * 4.2;
        rocketGroupRef.current.position.set(rx, ry, rz);
        rocketGroupRef.current.rotation.set(0.2, -rocketOrbitAng, -0.15);

        // Smooth camera zoom toward clicked planet OR full solar system overview
        if (focusedPlanet) {
          const targetBody = SOLAR_SYSTEM_BODIES[focusedPlanet];
          const targetPos = bodyWorldPositions.current[focusedPlanet];
          const zoomDist = Math.max(9.5, targetBody.radius * 4.4);

          const cx = targetPos.x + Math.sin(yaw.current) * Math.cos(pitch.current * 0.6) * zoomDist;
          const cy = targetPos.y + Math.sin(pitch.current * 0.6) * zoomDist + targetBody.radius * 0.8;
          const cz = targetPos.z + Math.cos(yaw.current) * Math.cos(pitch.current * 0.6) * zoomDist;

          desiredCamPosRef.current.set(cx, cy, cz);
          camera.position.lerp(desiredCamPosRef.current, dt * 4.2);
          smoothLookAtRef.current.lerp(targetPos, dt * 5.5);
          camera.lookAt(smoothLookAtRef.current);
        } else {
          // Solar system panoramic overview
          const overviewDist = 135;
          const cx = Math.sin(yaw.current) * Math.cos(pitch.current) * overviewDist;
          const cy = Math.sin(pitch.current) * overviewDist + 18;
          const cz = Math.cos(yaw.current) * Math.cos(pitch.current) * overviewDist;

          desiredCamPosRef.current.set(cx, cy, cz);
          camera.position.lerp(desiredCamPosRef.current, dt * 3.8);
          smoothLookAtRef.current.lerp(new THREE.Vector3(0, 0, 0), dt * 4.5);
          camera.lookAt(smoothLookAtRef.current);
        }
      }
    }

    // 7. Hyperspace warp speed streaks
    if (warpStarsRef.current && isWarping) {
      const posAttr = warpStarsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const speed = 240.0 * dt;

      for (let i = 0; i < WARP_LINE_COUNT; i++) {
        arr[i * 6 + 2] += speed;
        arr[i * 6 + 5] += speed;
        if (arr[i * 6 + 2] > 40) {
          arr[i * 6 + 2] -= 260;
          arr[i * 6 + 5] -= 260;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  // Helper to render interactive sci-fi reticle + planet label on hover/focus
  const renderPlanetReticle = (info: SolarBodyInfo) => {
    const isHovered = hoveredBody === info.id;
    const isFocused = focusedPlanet === info.id;
    if (!isHovered && !isFocused) return null;

    const ringInner = info.radius * 1.38;
    const ringOuter = info.radius * 1.48;
    const bracketDist = info.radius * 1.62;

    return (
      <Billboard follow={true}>
        <mesh>
          <ringGeometry args={[ringInner, ringOuter, 48]} />
          <meshBasicMaterial
            color={info.accentColor}
            transparent
            opacity={isFocused ? 0.95 : 0.7}
            depthWrite={false}
          />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
          <mesh
            key={`reticle-${info.id}-${idx}`}
            position={[Math.cos(ang) * bracketDist, Math.sin(ang) * bracketDist, 0]}
          >
            <boxGeometry args={[info.radius * 0.16, info.radius * 0.16, 0.04]} />
            <meshBasicMaterial color={info.accentColor} />
          </mesh>
        ))}
        <Text
          position={[0, info.radius * 1.95 + 0.6, 0]}
          fontSize={Math.max(0.75, info.radius * 0.42)}
          color={info.accentColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          {info.name}
        </Text>
        <Text
          position={[0, -(info.radius * 1.85 + 0.5), 0]}
          fontSize={Math.max(0.45, info.radius * 0.25)}
          color={info.isLandable ? '#4ade80' : '#f87171'}
          anchorX="center"
          anchorY="middle"
        >
          {info.isLandable ? '★ LANDABLE MISSION TARGET' : 'OBSERVATION ONLY'}
        </Text>
      </Billboard>
    );
  };

  return (
    <group
      name="SolarSystemOrbitNav"
      onPointerMissed={() => {
        setFocusedPlanet(null);
        window.dispatchEvent(new CustomEvent('solar-planet-selected', { detail: null }));
      }}
    >
      {/* ========================================================== */}
      {/* 1. 2,000 DEEP SPACE STAR PARTICLES & NEBULA CLOUDS         */}
      {/* ========================================================== */}
      <points ref={starfieldRef} geometry={starfieldGeo}>
        <pointsMaterial size={1.6} vertexColors transparent opacity={0.92} depthWrite={false} />
      </points>

      {/* Deep Space Nebula Clouds */}
      {[
        { pos: [-210, 55, -240] as [number, number, number], scale: 165, texIdx: 0 },
        { pos: [230, -45, -210] as [number, number, number], scale: 185, texIdx: 1 },
        { pos: [-160, -68, 220] as [number, number, number], scale: 150, texIdx: 2 },
        { pos: [195, 72, 195] as [number, number, number], scale: 175, texIdx: 3 },
      ].map((neb, idx) => (
        <Billboard key={`nebula-${idx}`} position={neb.pos} follow={true}>
          <mesh>
            <planeGeometry args={[neb.scale, neb.scale]} />
            <meshBasicMaterial
              map={nebulaTextures[neb.texIdx]}
              transparent
              opacity={0.32}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>
      ))}

      {/* ========================================================== */}
      {/* 2. THE SUN AT [0, 0, 0] WITH POINTLIGHT (INTENSITY 3.5)    */}
      {/* ========================================================== */}
      <pointLight position={[0, 0, 0]} color="#fff7ed" intensity={3.5} distance={0} decay={0} />
      <ambientLight color="#475569" intensity={0.48} />

      <group
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleClickBody('SUN');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHoverBody('SUN');
        }}
        onPointerOut={() => handleHoverBody(null)}
      >
        {/* Glowing Emissive Solar Sphere */}
        <mesh
          ref={(el) => {
            planetMeshRefs.current.SUN = el;
          }}
        >
          <sphereGeometry args={[SOLAR_SYSTEM_BODIES.SUN.radius, 48, 48]} />
          <meshStandardMaterial
            map={bodyTextures.SUN}
            emissive="#f97316"
            emissiveMap={bodyTextures.SUN}
            emissiveIntensity={1.65}
            roughness={0.2}
          />
        </mesh>

        {/* Inner Pulsing Corona Halo */}
        <mesh ref={sunCoronaRef}>
          <sphereGeometry args={[SOLAR_SYSTEM_BODIES.SUN.radius * 1.18, 32, 32]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.32}
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer Pulsing Solar Flare Corona */}
        <mesh ref={sunOuterHaloRef}>
          <sphereGeometry args={[SOLAR_SYSTEM_BODIES.SUN.radius * 1.45, 32, 32]} />
          <meshBasicMaterial
            color="#ea580c"
            transparent
            opacity={0.16}
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {renderPlanetReticle(SOLAR_SYSTEM_BODIES.SUN)}
      </group>

      {/* ========================================================== */}
      {/* 3. FAINT ORBIT PATH RINGS FOR ALL 8 PLANETS                */}
      {/* ========================================================== */}
      {(
        [
          'MERCURY',
          'VENUS',
          'EARTH',
          'MARS',
          'JUPITER',
          'SATURN',
          'URANUS',
          'NEPTUNE',
        ] as SolarBodyId[]
      ).map((id) => {
        const info = SOLAR_SYSTEM_BODIES[id];
        const isHighlighted = hoveredBody === id || focusedPlanet === id;
        return (
          <mesh key={`orbit-ring-${id}`} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[info.orbitRadius - 0.12, info.orbitRadius + 0.12, 128]} />
            <meshBasicMaterial
              color={isHighlighted ? info.accentColor : info.isLandable ? '#38bdf8' : '#64748b'}
              transparent
              opacity={isHighlighted ? 0.55 : info.isLandable ? 0.26 : 0.15}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* ========================================================== */}
      {/* 4. ASTEROID BELT BETWEEN MARS & JUPITER (120 INSTANCED)    */}
      {/* ========================================================== */}
      <instancedMesh
        ref={asteroidBeltRef}
        args={[undefined, undefined, ASTEROID_COUNT]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#78716c" roughness={0.88} metalness={0.18} />
      </instancedMesh>

      {/* ========================================================== */}
      {/* 5. ALL 8 ORBITING SOLAR SYSTEM PLANETS                     */}
      {/* ========================================================== */}
      {(
        [
          'MERCURY',
          'VENUS',
          'EARTH',
          'MARS',
          'JUPITER',
          'SATURN',
          'URANUS',
          'NEPTUNE',
        ] as SolarBodyId[]
      ).map((id) => {
        const info = SOLAR_SYSTEM_BODIES[id];
        const isActive = hoveredBody === id || focusedPlanet === id;

        return (
          <group
            key={id}
            ref={(el) => {
              planetGroupRefs.current[id] = el;
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClickBody(id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              handleHoverBody(id);
            }}
            onPointerOut={() => handleHoverBody(null)}
          >
            {/* Planet Sphere */}
            <mesh
              ref={(el) => {
                planetMeshRefs.current[id] = el;
              }}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[info.radius, 40, 40]} />
              <meshStandardMaterial
                map={bodyTextures[id]}
                roughness={0.78}
                metalness={0.12}
                emissive={info.emissiveColor}
                emissiveIntensity={isActive ? 0.42 : 0.06}
              />
            </mesh>

            {/* Earth's Subtle Blue Atmosphere Limb & Lunar Orbit Path */}
            {id === 'EARTH' && (
              <>
                <mesh>
                  <sphereGeometry args={[info.radius * 1.05, 32, 32]} />
                  <meshBasicMaterial
                    color="#38bdf8"
                    transparent
                    opacity={0.22}
                    side={THREE.BackSide}
                    depthWrite={false}
                  />
                </mesh>
                {/* Faint Lunar Orbit Ring around Earth */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry
                    args={[
                      SOLAR_SYSTEM_BODIES.MOON.orbitRadius - 0.06,
                      SOLAR_SYSTEM_BODIES.MOON.orbitRadius + 0.06,
                      64,
                    ]}
                  />
                  <meshBasicMaterial
                    color="#22d3ee"
                    transparent
                    opacity={0.35}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                  />
                </mesh>
              </>
            )}

            {/* Mars Subtle Orange Atmospheric Limb */}
            {id === 'MARS' && (
              <mesh>
                <sphereGeometry args={[info.radius * 1.06, 32, 32]} />
                <meshBasicMaterial
                  color="#f97316"
                  transparent
                  opacity={0.24}
                  side={THREE.BackSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Saturn's Iconic Concentric Icy Rings */}
            {info.hasRings && (
              <mesh rotation={[Math.PI * 0.42, 0.25, 0]}>
                <ringGeometry args={[info.radius * 1.35, info.radius * 2.45, 64]} />
                <meshStandardMaterial
                  map={saturnRingTexture}
                  color="#fef08a"
                  transparent
                  opacity={0.9}
                  roughness={0.5}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Uranus Subtle Polar Vertical Ring */}
            {id === 'URANUS' && (
              <mesh rotation={[0.15, 0, Math.PI * 0.48]}>
                <ringGeometry args={[info.radius * 1.35, info.radius * 1.5, 48]} />
                <meshBasicMaterial
                  color="#67e8f9"
                  transparent
                  opacity={0.28}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Always-visible subtle name tag for Landable Targets (Mars) */}
            {info.isLandable && !isActive && (
              <Billboard follow={true}>
                <Text
                  position={[0, info.radius + 1.4, 0]}
                  fontSize={0.75}
                  color={info.accentColor}
                  anchorX="center"
                  anchorY="middle"
                >
                  {info.name} ★
                </Text>
              </Billboard>
            )}

            {renderPlanetReticle(info)}
          </group>
        );
      })}

      {/* ========================================================== */}
      {/* 6. THE MOON ORBITING EARTH                                 */}
      {/* ========================================================== */}
      <group
        ref={(el) => {
          planetGroupRefs.current.MOON = el;
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleClickBody('MOON');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHoverBody('MOON');
        }}
        onPointerOut={() => handleHoverBody(null)}
      >
        <mesh
          ref={(el) => {
            planetMeshRefs.current.MOON = el;
          }}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[SOLAR_SYSTEM_BODIES.MOON.radius, 32, 32]} />
          <meshStandardMaterial
            map={bodyTextures.MOON}
            roughness={0.88}
            metalness={0.08}
            emissive={SOLAR_SYSTEM_BODIES.MOON.emissiveColor}
            emissiveIntensity={
              hoveredBody === 'MOON' || focusedPlanet === 'MOON' ? 0.45 : 0.08
            }
          />
        </mesh>

        {hoveredBody !== 'MOON' && focusedPlanet !== 'MOON' && (
          <Billboard follow={true}>
            <Text
              position={[0, SOLAR_SYSTEM_BODIES.MOON.radius + 0.95, 0]}
              fontSize={0.58}
              color="#22d3ee"
              anchorX="center"
              anchorY="middle"
            >
              MOON ★
            </Text>
          </Billboard>
        )}

        {renderPlanetReticle(SOLAR_SYSTEM_BODIES.MOON)}
      </group>

      {/* ========================================================== */}
      {/* 7. SOL-7 ROCKET IN ORBIT & WARP TRANSIT                    */}
      {/* ========================================================== */}
      <group ref={rocketGroupRef} position={[48, 1.5, 0]} scale={[0.16, 0.16, 0.16]}>
        <mesh>
          <cylinderGeometry args={[0.85, 0.85, 14, 20]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.25} />
        </mesh>
        <mesh position={[0, 8.5, 0]}>
          <coneGeometry args={[0.85, 3.0, 20]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const ang = (i * Math.PI) / 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * 1.1, -5.5, Math.sin(ang) * 1.1]}
              rotation={[0, ang, 0]}
            >
              <boxGeometry args={[0.6, 2.2, 0.06]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          );
        })}

        {isWarping && (
          <group position={[0, -8.2, 0]} rotation={[Math.PI, 0, 0]}>
            <mesh>
              <coneGeometry args={[0.7, 7.5, 16]} />
              <meshBasicMaterial color="#818cf8" />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
              <coneGeometry args={[1.1, 10.5, 16]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
            </mesh>
            <pointLight color="#818cf8" intensity={30} distance={25} />
          </group>
        )}

        {isReentering && (
          <group position={[0, 8.8, 0]}>
            <mesh>
              <sphereGeometry args={[1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
            </mesh>
            <pointLight color="#f97316" intensity={45} distance={18} />
          </group>
        )}
      </group>

      {/* ========================================================== */}
      {/* 8. HYPERSPACE WARP STREAKS                                 */}
      {/* ========================================================== */}
      {isWarping && (
        <lineSegments ref={warpStarsRef} geometry={warpLinesData}>
          <lineBasicMaterial vertexColors transparent opacity={0.85} linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};
