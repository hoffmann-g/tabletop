import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { Token } from '@canvas/Token'
import { ColorGrade } from '@canvas/effects/ColorGrade'

/**
 * The table canvas. Shadows are on from day one and tokens can emit colored
 * light — this is the 3D foundation the design calls for, even while we render
 * mostly flat tokens for now.
 */
export function Scene(): JSX.Element {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 10], fov: 45 }}
      gl={{ antialias: true }}
      style={{ height: '100%', width: '100%' }}
    >
      <color attach="background" args={['#0b0b0f']} />
      <ambientLight intensity={0.15} />

      {/* Ground: the battle map plane. Receives shadows cast by tokens. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1a24" />
      </mesh>

      <Grid
        args={[40, 40]}
        cellSize={1}
        cellColor="#2a2a38"
        sectionColor="#3a3a4f"
        infiniteGrid
        fadeDistance={50}
        position={[0, 0.01, 0]}
      />

      {/* Sample tokens — one emits a colored light that casts shadows. */}
      <Token position={[-2, 0, 0]} color="#c0c0d0" />
      <Token position={[2, 0, -1]} color="#d08060" light={{ color: '#ff7a3c', intensity: 6 }} />

      <OrbitControls makeDefault enableDamping />

      <ColorGrade />
    </Canvas>
  )
}
