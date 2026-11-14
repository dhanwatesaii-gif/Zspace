import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getWarningSignTexture } from '../../utils/proceduralTextures';

interface LaunchPadDetailsProps {
  elevatorPosY?: number;
}

export const LaunchPadDetails: React.FC<LaunchPadDetailsProps> = ({ elevatorPosY = 0.21 }) => {
  const signTexture = useMemo(() => getWarningSignTexture(), []);

  // Shared tower steel materials
  const towerSteelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b91c1c', // Classic launch umbilical tower crimson red
        roughness: 0.45,
        metalness: 0.65,
      }),
    []
  );

  const darkSteelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.5,
        metalness: 0.8,
      }),
    []
  );

  // Curved fuel pipes from ground to rocket engine thrust structure
  const { pipeGeo1, pipeGeo2, pipeGeo3 } = useMemo(() => {
    // Cryo LOX main feed line
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, 0.2, 2.8),
      new THREE.Vector3(-3.2, 0.8, 2.2),
      new THREE.Vector3(-1.8, 1.4, 1.2),
      new THREE.Vector3(-0.8, 1.85, 0.4),
    ]);
    // RP-1 Fuel supply line
    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, 0.2, -2.6),
      new THREE.Vector3(-3.0, 0.9, -1.9),
      new THREE.Vector3(-1.6, 1.5, -1.0),
      new THREE.Vector3(-0.6, 1.85, -0.4),
    ]);
    // Gaseous Nitrogen / Helium purge line
    const curve3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(3.8, 0.2, 2.2),
      new THREE.Vector3(2.6, 0.7, 1.6),
      new THREE.Vector3(1.5, 1.3, 0.9),
      new THREE.Vector3(0.7, 1.85, 0.3),
    ]);

    return {
      pipeGeo1: new THREE.TubeGeometry(curve1, 32, 0.16, 12, false),
      pipeGeo2: new THREE.TubeGeometry(curve2, 32, 0.14, 12, false),
      pipeGeo3: new THREE.TubeGeometry(curve3, 32, 0.10, 10, false),
    };
  }, []);

  // Launch Tower lattice levels
  const towerHeight = 25.5;
  const towerX = -6.2;
  const towerZ = 0;
  const towerSize = 2.6; // footprint width
  const levels = 10;
  const levelHeight = towerHeight / levels;

  return (
    <group name="LaunchPadDetailsGroup">
      {/* ========================================================== */}
      {/* 1. LAUNCH UMBILICAL TOWER (25.5 units tall scaffold)       */}
      {/* ========================================================== */}
      <group position={[towerX, 0, towerZ]} name="LaunchTower">
        {/* 4 Main Vertical Corner Columns */}
        {[
          [-towerSize / 2, -towerSize / 2],
          [towerSize / 2, -towerSize / 2],
          [-towerSize / 2, towerSize / 2],
          [towerSize / 2, towerSize / 2],
        ].map(([cx, cz], i) => (
          <mesh key={`col-${i}`} position={[cx, towerHeight / 2, cz]} material={towerSteelMat} castShadow>
            <cylinderGeometry args={[0.13, 0.16, towerHeight, 10]} />
          </mesh>
        ))}

        {/* Horizontal Perimeter Beams & Internal Platforms */}
        {Array.from({ length: levels + 1 }).map((_, lvl) => {
          const y = lvl * levelHeight;
          return (
            <group key={`level-${lvl}`} position={[0, y, 0]}>
              {/* Perimeter framing */}
              <mesh position={[0, 0, -towerSize / 2]} material={towerSteelMat}>
                <boxGeometry args={[towerSize, 0.14, 0.14]} />
              </mesh>
              <mesh position={[0, 0, towerSize / 2]} material={towerSteelMat}>
                <boxGeometry args={[towerSize, 0.14, 0.14]} />
              </mesh>
              <mesh position={[-towerSize / 2, 0, 0]} material={towerSteelMat}>
                <boxGeometry args={[0.14, 0.14, towerSize]} />
              </mesh>
              <mesh position={[towerSize / 2, 0, 0]} material={towerSteelMat}>
                <boxGeometry args={[0.14, 0.14, towerSize]} />
              </mesh>
              {/* Grated steel floor plate */}
              <mesh position={[0, -0.02, 0]}>
                <boxGeometry args={[towerSize * 0.92, 0.04, towerSize * 0.92]} />
                <primitive object={darkSteelMat} />
              </mesh>
            </group>
          );
        })}

        {/* Diagonal Truss Cross-Braces on Tower Sides */}
        {Array.from({ length: levels }).map((_, lvl) => {
          const yMid = lvl * levelHeight + levelHeight / 2;
          const diagLength = Math.hypot(towerSize, levelHeight);
          const angle = Math.atan2(levelHeight, towerSize);

          return (
            <group key={`diag-${lvl}`} position={[0, yMid, 0]}>
              {/* Front side diagonal */}
              <mesh position={[0, 0, towerSize / 2]} rotation={[0, 0, angle]}>
                <boxGeometry args={[diagLength, 0.08, 0.08]} />
                <primitive object={darkSteelMat} />
              </mesh>
              {/* Back side diagonal */}
              <mesh position={[0, 0, -towerSize / 2]} rotation={[0, 0, -angle]}>
                <boxGeometry args={[diagLength, 0.08, 0.08]} />
                <primitive object={darkSteelMat} />
              </mesh>
              {/* Left side diagonal */}
              <mesh position={[-towerSize / 2, 0, 0]} rotation={[angle, 0, 0]}>
                <boxGeometry args={[0.08, diagLength, 0.08]} />
                <primitive object={darkSteelMat} />
              </mesh>
            </group>
          );
        })}

        {/* Top Crane Mast & Lightning Diverter Needle */}
        <group position={[0, towerHeight, 0]}>
          {/* Derrick Crane Arm */}
          <mesh position={[1.2, 1.4, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[3.2, 0.22, 0.22]} />
            <primitive object={towerSteelMat} />
          </mesh>
          {/* Lightning Rod */}
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.04, 0.08, 5, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Red Aviation Warning Beacon */}
          <mesh position={[0, 5.0, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <pointLight position={[0, 5.0, 0]} color="#ef4444" intensity={1.5} distance={15} />
        </group>

        {/* ========================================================== */}
        {/* 2. CREW ACCESS ARM / BRIDGE (Horizontal beam to hatch)     */}
        {/* ========================================================== */}
        {/* Extends towards +X from tower into rocket door at [-1.01, 18.9, 0] */}
        <group position={[0, 18.9, 0]} name="AccessArm">
          {/* Bridge Walkway Span (spanning from x=0 to x=5.1) */}
          <mesh position={[2.55, -0.1, 0]}>
            <boxGeometry args={[5.1, 0.18, 1.3]} />
            <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.6} />
          </mesh>

          {/* Yellow Safety Railings along the walkway */}
          <mesh position={[2.55, 0.45, 0.6]}>
            <boxGeometry args={[4.9, 0.06, 0.06]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
          <mesh position={[2.55, 0.45, -0.6]}>
            <boxGeometry args={[4.9, 0.06, 0.06]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>

          {/* Vertical railing posts */}
          {[0.5, 1.8, 3.2, 4.5].map((rx) => (
            <group key={`rail-post-${rx}`}>
              <mesh position={[rx, 0.2, 0.6]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                <meshStandardMaterial color="#eab308" />
              </mesh>
              <mesh position={[rx, 0.2, -0.6]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                <meshStandardMaterial color="#eab308" />
              </mesh>
            </group>
          ))}

          {/* Clean White Room Astronaut Boarding Cab at rocket interface */}
          <group position={[4.6, 0.7, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.2, 1.8, 1.5]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* White room inspection window */}
            <mesh position={[0, 0.2, 0.76]}>
              <planeGeometry args={[0.6, 0.4]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.1} emissive="#0284c7" emissiveIntensity={0.5} />
            </mesh>
            {/* Flexible accordion seal collar around rocket hatch */}
            <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.55, 0.55, 0.15, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* ========================================================== */}
        {/* 2b. GANTRY TOWER ELEVATOR RAILS & LIFT CAR                 */}
        {/* ========================================================== */}
        {/* Vertical Elevator Guide Rails on +X tower face */}
        <mesh position={[1.36, 10.0, -0.6]}>
          <cylinderGeometry args={[0.04, 0.04, 20.0, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.36, 10.0, 0.6]}>
          <cylinderGeometry args={[0.04, 0.04, 20.0, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Ground Call Station Post */}
        <group position={[1.42, 0.8, -0.9]}>
          <mesh>
            <boxGeometry args={[0.18, 0.45, 0.15]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.1, 0.05, 0]}>
            <circleGeometry args={[0.04, 12]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
        </group>

        {/* The Elevator Lift Cabin Car (moving between y = 0.21 and y = 18.9) */}
        <group position={[1.5, elevatorPosY, 0]} name="ElevatorCabin">
          {/* Cabin Floor */}
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[1.6, 0.12, 1.6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          {/* Cabin Roof */}
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[1.6, 0.12, 1.6]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          {/* Strobe Beacon on Roof */}
          <mesh position={[0, 2.45, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.18, 12]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          {/* 4 Corner Steel Posts */}
          {[[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.72], [0.72, 0.72]].map(([px, pz], pi) => (
            <mesh key={`post-${pi}`} position={[px, 1.1, pz]}>
              <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
          ))}
          {/* Safety Glass Walls on sides & back */}
          <mesh position={[-0.74, 1.1, 0]}>
            <planeGeometry args={[1.44, 2.1]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} roughness={0.1} depthWrite={false} />
          </mesh>
          <mesh position={[0, 1.1, -0.74]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.44, 2.1]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} roughness={0.1} depthWrite={false} />
          </mesh>
          <mesh position={[0, 1.1, 0.74]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.44, 2.1]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} roughness={0.1} depthWrite={false} />
          </mesh>
          {/* Cabin Interior Overhead Spotlight */}
          <pointLight position={[0, 2.0, 0]} color="#fef08a" intensity={2.5} distance={5} />
        </group>
      </group>

      {/* ========================================================== */}
      {/* 3. FUEL PIPES (Curved tubes running to rocket base)        */}
      {/* ========================================================== */}
      <group name="FuelPipes">
        <mesh geometry={pipeGeo1} castShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh geometry={pipeGeo2} castShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.8} />
        </mesh>
        <mesh geometry={pipeGeo3} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Ground Manifold Terminal Boxes */}
        <mesh position={[-4.5, 0.3, 2.8]} castShadow>
          <boxGeometry args={[0.9, 0.6, 0.9]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh position={[-4.2, 0.3, -2.6]} castShadow>
          <boxGeometry args={[0.9, 0.6, 0.9]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* 4. WARNING SIGNS ("DANGER") Near Pad Base                  */}
      {/* ========================================================== */}
      <group name="WarningSigns">
        {[
          { pos: [-10, 0.5, 12] as [number, number, number], rotY: 0.2 },
          { pos: [10, 0.5, 12] as [number, number, number], rotY: -0.2 },
          { pos: [12, 0.5, -10] as [number, number, number], rotY: -Math.PI * 0.7 },
        ].map((sign, idx) => (
          <group key={`sign-${idx}`} position={sign.pos} rotation={[0, sign.rotY, 0]}>
            {/* Stand Post */}
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            {/* Red Sign Backing Box */}
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.8, 0.44, 0.05]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
            {/* Front Procedural Sign Decal */}
            <mesh position={[0, 0.24, 0.03]}>
              <planeGeometry args={[0.76, 0.4]} />
              <meshStandardMaterial map={signTexture} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================== */}
      {/* 5. 4 FLOOD LIGHTS WITH SPOTLIGHTS (at pad corners)         */}
      {/* ========================================================== */}
      <group name="FloodLights">
        {[
          { pos: [-13, 0, -13] as [number, number, number], aim: [0, 8, 0] as [number, number, number] },
          { pos: [-13, 0, 13] as [number, number, number], aim: [0, 8, 0] as [number, number, number] },
          { pos: [13, 0, -13] as [number, number, number], aim: [0, 8, 0] as [number, number, number] },
          { pos: [13, 0, 13] as [number, number, number], aim: [0, 8, 0] as [number, number, number] },
        ].map((light, i) => (
          <group key={`flood-${i}`} position={light.pos}>
            {/* Tall steel light pole (12 units) */}
            <mesh position={[0, 6, 0]} material={darkSteelMat} castShadow>
              <cylinderGeometry args={[0.16, 0.24, 12, 10]} />
            </mesh>

            {/* Crossbar Luminaire Mount */}
            <mesh position={[0, 11.9, 0]} material={darkSteelMat}>
              <boxGeometry args={[1.4, 0.2, 0.4]} />
            </mesh>

            {/* Glowing Emissive Light Fixtures */}
            {[-0.45, 0.45].map((xOffset, fi) => (
              <group key={`bulb-${fi}`} position={[xOffset, 11.8, 0]}>
                {/* Reflector Hood */}
                <mesh rotation={[Math.PI / 4, 0, 0]}>
                  <cylinderGeometry args={[0.2, 0.28, 0.35, 12]} />
                  <primitive object={darkSteelMat} />
                </mesh>
                {/* Glowing Emissive Bulb */}
                <mesh position={[0, -0.1, 0.05]}>
                  <sphereGeometry args={[0.16, 12, 12]} />
                  <meshStandardMaterial
                    color="#fef08a"
                    emissive="#facc15"
                    emissiveIntensity={2.8}
                    roughness={0.1}
                  />
                </mesh>
              </group>
            ))}

            {/* Real SpotLight illuminating the rocket and pad */}
            <spotLight
              position={[0, 12, 0]}
              target-position={light.aim}
              intensity={45}
              angle={Math.PI / 4}
              penumbra={0.5}
              distance={48}
              color="#fef9c3"
              castShadow
            />
          </group>
        ))}
      </group>

      {/* ========================================================== */}
      {/* 6. CONTROL BUNKER BUILDING NEARBY                          */}
      {/* ========================================================== */}
      {/* Positioned at x = -24, z = 18 with flat roof & antenna     */}
      <group position={[-24, 0, 18]} name="ControlBunker">
        {/* Main Bunker Concrete Structure */}
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[9, 4.4, 7]} />
          <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.15} />
        </mesh>

        {/* Reinforced Foundation Apron */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[10.2, 0.4, 8.2]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>

        {/* Blast Door on Front (+X side facing launch pad) */}
        <group position={[4.52, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <planeGeometry args={[1.8, 2.4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Heavy Steel Reinforcement Ribs */}
          <mesh position={[0, 0.4, 0.02]}>
            <boxGeometry args={[1.7, 0.1, 0.04]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0, -0.4, 0.02]}>
            <boxGeometry args={[1.7, 0.1, 0.04]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          {/* Bunker Door Status Light */}
          <mesh position={[0.7, 0.8, 0.03]}>
            <circleGeometry args={[0.08, 12]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>

        {/* Narrow Armored Slit Observation Windows */}
        <mesh position={[4.52, 3.0, 1.8]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.0, 0.45]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.1} />
        </mesh>

        {/* Roof Parapet Rim */}
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[9.2, 0.25, 7.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Tall Communications Antenna Mast */}
        <group position={[-2.5, 4.6, -1.8]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.05, 0.1, 6, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Satellite Dish on Antenna */}
          <mesh position={[0.6, 4.5, 0]} rotation={[0.4, 0.6, -0.3]}>
            <sphereGeometry args={[0.9, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {/* Blinking Red Beacon on Antenna Top */}
          <mesh position={[0, 6.1, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* HVAC / Cryo Air Ventilation Ducts on Roof */}
        <mesh position={[2.0, 5.0, -1.2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.8, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
