// Shared map layout, used by both the rendered surface and player movement.
export const MAP_SIZE = 40
export const MAP_CORNER_RADIUS = 3

export const ROAD_LENGTH = 29
export const ROAD_WIDTH = 6
export const ROAD_CORNER_RADIUS = 1

export const SIDEWALK_WIDTH = 1.5
export const CURB_HEIGHT = 0.15

/** Axis-aligned box on the ground (XZ) that the player cannot walk into. */
export type Obstacle = { x: number; z: number; halfX: number; halfZ: number }

// VW Fox model: faces +X, ~2.92 long and ~1.71 wide.
const CAR_HALF_LENGTH = 1.46
const CAR_HALF_WIDTH = 0.86
const CURB_GAP = 0.15

// Right lane of the north-south road, nose pointing -Z (with traffic), against the +X curb.
export const PARKED_CAR = {
  x: ROAD_WIDTH / 2 - CAR_HALF_WIDTH - CURB_GAP,
  z: 9,
  yaw: Math.PI / 2,
}

// Rotated 90 degrees, so the car's length runs along Z.
export const OBSTACLES: readonly Obstacle[] = [
  { x: PARKED_CAR.x, z: PARKED_CAR.z, halfX: CAR_HALF_WIDTH, halfZ: CAR_HALF_LENGTH },
]

const ROAD_HALF_WIDTH = ROAD_WIDTH / 2
const ROAD_HALF_LENGTH = ROAD_LENGTH / 2
const SIDEWALK_HALF_WIDTH = ROAD_HALF_WIDTH + SIDEWALK_WIDTH
const SIDEWALK_HALF_LENGTH = ROAD_HALF_LENGTH + SIDEWALK_WIDTH
const SIDEWALK_CORNER_RADIUS = ROAD_CORNER_RADIUS + SIDEWALK_WIDTH

/** Whether (x, y) lies inside an origin-centered, axis-aligned rounded rectangle. */
function inRoundedRect(x: number, y: number, hx: number, hy: number, r: number) {
  const qx = Math.abs(x) - (hx - r)
  const qy = Math.abs(y) - (hy - r)
  if (qx <= 0 || qy <= 0) return Math.abs(x) <= hx && Math.abs(y) <= hy
  return Math.hypot(qx, qy) <= r
}

/** Whether (x, y) lies inside the union of a horizontal and a vertical arm. */
function inCross(x: number, y: number, halfWidth: number, halfLength: number, r: number) {
  return (
    inRoundedRect(x, y, halfLength, halfWidth, r) || inRoundedRect(x, y, halfWidth, halfLength, r)
  )
}

/** Ground height at a world XZ position: raised on the sidewalk, flat elsewhere. */
export function getGroundHeight(x: number, z: number) {
  const onSidewalk = inCross(x, z, SIDEWALK_HALF_WIDTH, SIDEWALK_HALF_LENGTH, SIDEWALK_CORNER_RADIUS)
  if (!onSidewalk) return 0
  const onRoad = inCross(x, z, ROAD_HALF_WIDTH, ROAD_HALF_LENGTH, ROAD_CORNER_RADIUS)
  return onRoad ? 0 : CURB_HEIGHT
}
