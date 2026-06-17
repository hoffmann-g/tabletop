import type { ColorRepresentation } from 'three'

export interface TokenLight {
  color: ColorRepresentation
  intensity: number
  /** How far the light reaches; 0 = no falloff. */
  distance?: number
}

export interface TokenProps {
  position: [number, number, number]
  color: ColorRepresentation
  /** Optional colored light emitted by the token, casting shadows on the map. */
  light?: TokenLight
}

/**
 * A single token on the table. Modeled as a 3D mesh (not a flat sprite) so that
 * shadows, lights and future 3D models work without rearchitecting. The flat
 * top is where the token artwork (png/gif) will be textured later.
 */
export function Token({ position, color, light }: TokenProps): JSX.Element {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>

      {light && (
        <pointLight
          position={[0, 1.4, 0]}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance ?? 12}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
      )}
    </group>
  )
}
