import { Shape } from 'three'

export const MAP_SIZE = 40
export const MAP_CORNER_RADIUS = 3
const BORDER_WIDTH = 0.4

const ROAD_LENGTH = 29
const ROAD_WIDTH = 6
const ROAD_CORNER_RADIUS = 1

const DASH_LENGTH = 1
const DASH_WIDTH = 0.25
const DASH_GAP = 1.5

const GRASS_COLOR = '#4a7c2f'
const BORDER_COLOR = '#6aa84f'
const ROAD_COLOR = '#1a1a1a'
const DASH_COLOR = '#e0e0e0'

// Small vertical offsets keep stacked flat layers from z-fighting.
const BORDER_Y = 0
const GRASS_Y = 0.005
const ROAD_Y = 0.01
const DASH_Y = 0.015

const FLAT = [-Math.PI / 2, 0, 0] as const

/** Rounded rectangle centered on the origin, in the XY plane. */
function roundedRect(width: number, height: number, radius: number) {
  const x = -width / 2
  const y = -height / 2
  const shape = new Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + height - radius)
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  shape.lineTo(x + radius, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}

/** Dash offsets along one road arm, skipping the intersection. */
function dashOffsets() {
  const start = ROAD_WIDTH / 2 + DASH_GAP
  const end = ROAD_LENGTH / 2 - DASH_GAP
  const offsets: number[] = []
  for (let d = start + DASH_LENGTH / 2; d + DASH_LENGTH / 2 <= end; d += DASH_LENGTH + DASH_GAP) {
    offsets.push(d, -d)
  }
  return offsets
}

// The layout is static, so shapes are built once at module load.
const border = roundedRect(
  MAP_SIZE + BORDER_WIDTH * 2,
  MAP_SIZE + BORDER_WIDTH * 2,
  MAP_CORNER_RADIUS + BORDER_WIDTH,
)
const grass = roundedRect(MAP_SIZE, MAP_SIZE, MAP_CORNER_RADIUS)
const road = roundedRect(ROAD_WIDTH, ROAD_LENGTH, ROAD_CORNER_RADIUS)
const dashes = dashOffsets()

export function Surface() {
  return (
    <group>
      <mesh rotation={FLAT} position-y={BORDER_Y}>
        <shapeGeometry args={[border, 16]} />
        <meshStandardMaterial color={BORDER_COLOR} />
      </mesh>

      <mesh rotation={FLAT} position-y={GRASS_Y} receiveShadow>
        <shapeGeometry args={[grass, 16]} />
        <meshStandardMaterial color={GRASS_COLOR} />
      </mesh>

      {/* Two crossing roads: north-south and east-west. */}
      {[0, Math.PI / 2].map((yaw) => (
        <group key={yaw} rotation-y={yaw}>
          <mesh rotation={FLAT} position-y={ROAD_Y} receiveShadow>
            <shapeGeometry args={[road, 8]} />
            <meshStandardMaterial color={ROAD_COLOR} />
          </mesh>

          {dashes.map((z) => (
            <mesh key={z} rotation={FLAT} position={[0, DASH_Y, z]} receiveShadow>
              <planeGeometry args={[DASH_WIDTH, DASH_LENGTH]} />
              <meshStandardMaterial color={DASH_COLOR} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
