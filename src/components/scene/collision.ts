import type { Vector3 } from 'three'
import type { Obstacle } from './mapLayout'

/**
 * Pushes a circle (the player's footprint) out of every obstacle box, in place.
 * Sliding along a box edge falls out naturally: only the penetrating axis is corrected.
 */
export function resolveCollisions(position: Vector3, radius: number, obstacles: readonly Obstacle[]) {
  for (const box of obstacles) {
    const dx = position.x - box.x
    const dz = position.z - box.z
    const closestX = Math.max(-box.halfX, Math.min(dx, box.halfX))
    const closestZ = Math.max(-box.halfZ, Math.min(dz, box.halfZ))
    const offsetX = dx - closestX
    const offsetZ = dz - closestZ
    const distance = Math.hypot(offsetX, offsetZ)

    if (distance > 0) {
      // Center outside the box: push away from the closest point.
      if (distance < radius) {
        const push = (radius - distance) / distance
        position.x += offsetX * push
        position.z += offsetZ * push
      }
      continue
    }

    // Center inside the box: exit through the nearest face.
    const exitX = box.halfX - Math.abs(dx) + radius
    const exitZ = box.halfZ - Math.abs(dz) + radius
    if (exitX < exitZ) {
      position.x += Math.sign(dx || 1) * exitX
    } else {
      position.z += Math.sign(dz || 1) * exitZ
    }
  }
}
