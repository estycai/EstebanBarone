import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF, useKeyboardControls } from '@react-three/drei'
import { Group, MathUtils, Mesh, Vector3 } from 'three'
import type { Control } from './controls'
import { resolveCollisions } from './collision'
import { getGroundHeight, MAP_CORNER_RADIUS, MAP_SIZE, OBSTACLES } from './mapLayout'

const MODEL_URL = '/models/yo.glb'
const WALK_SPEED = 2.5
// Footprint radius used against obstacles.
const PLAYER_RADIUS = 0.3
const TURN_SPEED = 10
// How quickly the player settles onto a new ground height (curb steps).
const STEP_SPEED = 20
const CAMERA_FOLLOW_SPEED = 5
const FADE_DURATION = 0.2
const LOOK_AT_HEIGHT = 1.0
const INITIAL_CAMERA_DISTANCE = 5.2
const MIN_CAMERA_DISTANCE = 2.5
const MAX_CAMERA_DISTANCE = 15
const ZOOM_SENSITIVITY = 0.001
const INITIAL_PITCH = 0.29
// Keeps the player this far inside the grass edge.
const EDGE_MARGIN = 0.5
const BOUNDS_HALF_SIZE = MAP_SIZE / 2 - EDGE_MARGIN
const BOUNDS_CORNER_RADIUS = MAP_CORNER_RADIUS - EDGE_MARGIN
const MIN_PITCH = 0.05
const MAX_PITCH = 1.3
const DRAG_SENSITIVITY = 0.005
const UP = new Vector3(0, 1, 0)

type AnimationName = 'Idle' | 'Walk' | 'Wave'

// Reused per frame to avoid allocations.
const direction = new Vector3()
const desiredCameraPosition = new Vector3()
const lookAtTarget = new Vector3()
const cameraOffset = new Vector3()

/** Clamps a ground position (in place) to the map's rounded-square bounds. */
function clampToMap(position: Vector3) {
  const limit = BOUNDS_HALF_SIZE
  position.x = MathUtils.clamp(position.x, -limit, limit)
  position.z = MathUtils.clamp(position.z, -limit, limit)

  // Inside a corner zone, keep the position within the corner's arc.
  const inner = BOUNDS_HALF_SIZE - BOUNDS_CORNER_RADIUS
  const overX = Math.abs(position.x) - inner
  const overZ = Math.abs(position.z) - inner
  if (overX > 0 && overZ > 0) {
    const distance = Math.hypot(overX, overZ)
    if (distance > BOUNDS_CORNER_RADIUS) {
      const scale = BOUNDS_CORNER_RADIUS / distance
      position.x = Math.sign(position.x) * (inner + overX * scale)
      position.z = Math.sign(position.z) * (inner + overZ * scale)
    }
  }
}

/** Shortest signed angle difference from `from` to `to`, in radians. */
function angleDelta(from: number, to: number) {
  return MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI
}

export function Player() {
  const groupRef = useRef<Group>(null)
  const currentAnimation = useRef<AnimationName>('Idle')
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, groupRef)
  const [, getKeys] = useKeyboardControls<Control>()
  const gl = useThree((state) => state.gl)
  // Orbit angles around the player, driven by mouse drag.
  const cameraYaw = useRef(0)
  const cameraPitch = useRef(INITIAL_PITCH)
  const cameraDistance = useRef(INITIAL_CAMERA_DISTANCE)

  useEffect(() => {
    const canvas = gl.domElement
    let isDragging = false

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true
      canvas.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      cameraYaw.current -= event.movementX * DRAG_SENSITIVITY
      cameraPitch.current = MathUtils.clamp(
        cameraPitch.current + event.movementY * DRAG_SENSITIVITY,
        MIN_PITCH,
        MAX_PITCH,
      )
    }
    const onPointerUp = (event: PointerEvent) => {
      isDragging = false
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      // Exponential zoom feels uniform at every distance.
      cameraDistance.current = MathUtils.clamp(
        cameraDistance.current * Math.exp(event.deltaY * ZOOM_SENSITIVITY),
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE,
      )
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [gl])

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
      }
    })
  }, [scene])

  useEffect(() => {
    actions.Idle?.reset().fadeIn(FADE_DURATION).play()
  }, [actions])

  useFrame((state, delta) => {
    const player = groupRef.current
    if (!player) return

    const { forward, backward, left, right } = getKeys()
    // Camera-relative movement: W moves away from the camera.
    direction.set(Number(right) - Number(left), 0, Number(backward) - Number(forward))
    const isMoving = direction.lengthSq() > 0

    if (isMoving) {
      direction.normalize().applyAxisAngle(UP, cameraYaw.current)
      player.position.addScaledVector(direction, WALK_SPEED * delta)
      resolveCollisions(player.position, PLAYER_RADIUS, OBSTACLES)
      clampToMap(player.position)

      // The model faces +Z by default, so yaw = atan2(x, z).
      const targetYaw = Math.atan2(direction.x, direction.z)
      const step = 1 - Math.exp(-TURN_SPEED * delta)
      player.rotation.y += angleDelta(player.rotation.y, targetYaw) * step
    }

    // Ease toward the ground height so curbs read as a quick step, not a pop.
    const groundHeight = getGroundHeight(player.position.x, player.position.z)
    player.position.y += (groundHeight - player.position.y) * (1 - Math.exp(-STEP_SPEED * delta))

    const nextAnimation: AnimationName = isMoving ? 'Walk' : 'Idle'
    if (nextAnimation !== currentAnimation.current) {
      actions[currentAnimation.current]?.fadeOut(FADE_DURATION)
      actions[nextAnimation]?.reset().fadeIn(FADE_DURATION).play()
      currentAnimation.current = nextAnimation
    }

    // Third-person orbit camera: spherical offset around the player's chest.
    lookAtTarget.copy(player.position).setY(player.position.y + LOOK_AT_HEIGHT)
    const pitch = cameraPitch.current
    cameraOffset
      .set(0, Math.sin(pitch), Math.cos(pitch))
      .multiplyScalar(cameraDistance.current)
      .applyAxisAngle(UP, cameraYaw.current)
    desiredCameraPosition.copy(lookAtTarget).add(cameraOffset)
    state.camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-CAMERA_FOLLOW_SPEED * delta))
    state.camera.lookAt(lookAtTarget)
  })

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
