import { Vector3 } from 'three'
import { MAP_SIZE } from './mapLayout'

// Direction from the map center towards the sun (in front of the default camera view).
const SUN_DIRECTION = new Vector3(0.4, 0.45, -1).normalize()
const LIGHT_DISTANCE = 30
const DISC_DISTANCE = 200
const DISC_RADIUS = 10

const SUN_COLOR = '#fff4d6'
const DISC_COLOR = '#ffe27a'
const GLOW_COLOR = '#fff1b0'

// Shadow frustum covers the whole map plus a small margin.
const SHADOW_EXTENT = MAP_SIZE / 2 + 2

const lightPosition = SUN_DIRECTION.clone().multiplyScalar(LIGHT_DISTANCE)
const discPosition = SUN_DIRECTION.clone().multiplyScalar(DISC_DISTANCE)

/** Visible sun disc plus the directional light it casts. */
export function Sun() {
  return (
    <>
      <directionalLight
        position={lightPosition}
        color={SUN_COLOR}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        // Offsets that prevent self-shadowing stripes (shadow acne) on curved meshes.
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-far={LIGHT_DISTANCE * 2 + MAP_SIZE}
      />

      <group position={discPosition}>
        <mesh>
          <sphereGeometry args={[DISC_RADIUS, 32, 32]} />
          <meshBasicMaterial color={DISC_COLOR} toneMapped={false} />
        </mesh>
        {/* Soft halo around the disc. */}
        <mesh>
          <sphereGeometry args={[DISC_RADIUS * 1.6, 32, 32]} />
          <meshBasicMaterial color={GLOW_COLOR} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
    </>
  )
}
