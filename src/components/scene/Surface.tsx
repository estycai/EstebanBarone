import { CanvasTexture, RepeatWrapping, Shape, SRGBColorSpace } from 'three'
import {
  CURB_HEIGHT,
  MAP_CORNER_RADIUS,
  MAP_SIZE,
  ROAD_CORNER_RADIUS,
  ROAD_LENGTH,
  ROAD_WIDTH,
  SIDEWALK_WIDTH,
} from './mapLayout'

const BORDER_WIDTH = 0.4
const TILE_SIZE = 0.75

const DASH_LENGTH = 1
const DASH_WIDTH = 0.25
const DASH_GAP = 1.5

const GRASS_COLOR = '#4a7c2f'
const BORDER_COLOR = '#6aa84f'
const ROAD_COLOR = '#1a1a1a'
const DASH_COLOR = '#e0e0e0'
const TILE_COLOR = '#d4d4d4'
const TILE_JOINT_COLOR = '#a9a9a9'
const CURB_COLOR = '#bdbdbd'

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

/**
 * Union outline of two crossing arms centered on the origin, in the XY plane:
 * rounded outer arm ends and sharp concave corners where the arms meet.
 */
function crossShape(halfWidth: number, halfLength: number, endRadius: number) {
  const w = halfWidth
  const l = halfLength
  const r = endRadius
  const shape = new Shape()
  shape.moveTo(w, -w)
  // Right arm.
  shape.lineTo(l - r, -w)
  shape.quadraticCurveTo(l, -w, l, -w + r)
  shape.lineTo(l, w - r)
  shape.quadraticCurveTo(l, w, l - r, w)
  shape.lineTo(w, w)
  // Top arm.
  shape.lineTo(w, l - r)
  shape.quadraticCurveTo(w, l, w - r, l)
  shape.lineTo(-w + r, l)
  shape.quadraticCurveTo(-w, l, -w, l - r)
  shape.lineTo(-w, w)
  // Left arm.
  shape.lineTo(-l + r, w)
  shape.quadraticCurveTo(-l, w, -l, w - r)
  shape.lineTo(-l, -w + r)
  shape.quadraticCurveTo(-l, -w, -l + r, -w)
  shape.lineTo(-w, -w)
  // Bottom arm.
  shape.lineTo(-w, -l + r)
  shape.quadraticCurveTo(-w, -l, -w + r, -l)
  shape.lineTo(w - r, -l)
  shape.quadraticCurveTo(w, -l, w, -l + r)
  shape.lineTo(w, -w)
  return shape
}

/**
 * One sidewalk tile with joint lines on its edges. Shape and extrude cap UVs
 * are in world units, so repeating by 1 / TILE_SIZE gives square tiles of that size.
 */
function createTileTexture() {
  const size = 128
  const joint = 4
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = TILE_JOINT_COLOR
    context.fillRect(0, 0, size, size)
    context.fillStyle = TILE_COLOR
    context.fillRect(joint / 2, joint / 2, size - joint, size - joint)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(1 / TILE_SIZE, 1 / TILE_SIZE)
  texture.anisotropy = 8
  return texture
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
const road = crossShape(ROAD_WIDTH / 2, ROAD_LENGTH / 2, ROAD_CORNER_RADIUS)
// The sidewalk is a wider cross with the road cut out, extruded into a curb.
const sidewalk = crossShape(
  ROAD_WIDTH / 2 + SIDEWALK_WIDTH,
  ROAD_LENGTH / 2 + SIDEWALK_WIDTH,
  ROAD_CORNER_RADIUS + SIDEWALK_WIDTH,
)
sidewalk.holes.push(road)
const curbExtrusion = { depth: CURB_HEIGHT, bevelEnabled: false, curveSegments: 8 }
const tileTexture = createTileTexture()
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

      {/* Raised curb: extrusion runs along local +Z, which FLAT turns into world +Y. */}
      <mesh rotation={FLAT} castShadow receiveShadow>
        <extrudeGeometry args={[sidewalk, curbExtrusion]} />
        {/* Extrude groups: 0 = top/bottom caps, 1 = side walls. */}
        <meshStandardMaterial attach="material-0" map={tileTexture} />
        <meshStandardMaterial attach="material-1" color={CURB_COLOR} />
      </mesh>

      <mesh rotation={FLAT} position-y={ROAD_Y} receiveShadow>
        <shapeGeometry args={[road, 8]} />
        <meshStandardMaterial color={ROAD_COLOR} />
      </mesh>

      {/* Lane dashes on both arms: north-south and east-west. */}
      {[0, Math.PI / 2].map((yaw) => (
        <group key={yaw} rotation-y={yaw}>
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
